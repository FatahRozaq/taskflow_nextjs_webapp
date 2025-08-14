"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AddTask from "./addTask";

type TaskStatus = "Todo" | "In Progress" | "Done" | "pending";
type TaskPriority = "Low" | "Medium" | "High";

interface Category {
  category_id: number;
  name: string;
  color: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  category?: {
    category_id: number;
    name: string;
    color: string;
  } | null;
}

type StatusFilter = "active" | "all" | TaskStatus;

type SortBy = "due_date" | "created_at";
type SortDir = "asc" | "desc";

function formatDateFromDB(dateInput: string | null | undefined): string {
  if (typeof dateInput !== 'string' || !dateInput.trim()) return 'No due date';
  const s = dateInput.trim();

  const match = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?/
  );
  if (!match) return s;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour24 = match[4] ? parseInt(match[4], 10) : 0;
  const minute = match[5] ? parseInt(match[5], 10) : 0;

  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  const t = [0,3,2,5,0,3,5,1,4,6,2,4];
  let y = year;
  if (month < 3) y -= 1;
  const dow = (y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) + t[month - 1] + day) % 7;

  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const hh = String(hour12).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');

  return `${weekdays[dow]}, ${months[month - 1]} ${day}, ${year}, ${hh}:${mm} ${ampm}`;
}

export default function TasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState<SortBy>("due_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [categories, setCategories] = useState<Category[]>([]);

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("Todo");
  const [editCategoryId, setEditCategoryId] = useState<number | "">("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("Medium");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Gagal mengambil categories:", err);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api.get(`/users/${user?.userId}/tasks`);
      const mappedTasks: Task[] = (res.data.data || []).map((t: any) => ({
        id: t.task_id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        created_at: t.created_at,
        completed_at: t.completed_at,
        category: t.category
          ? {
              category_id: t.category.category_id,
              name: t.category.name,
              color: t.category.color,
            }
          : null,
      }));
      setTasks(mappedTasks);
    } catch (err) {
      console.error("Gagal mengambil tasks:", err);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const visibleTasks = useMemo(() => {
    const byStatus = (task: Task) => {
      if (statusFilter === "active") return task.status !== "Done";
      if (statusFilter === "all") return true;
      return task.status === statusFilter;
    };

    const byCategory = (task: Task) => {
      if (categoryFilter === "all") return true;
      return task.category?.category_id === categoryFilter;
    };

    const byPriority = (task: Task) => {
      if (priorityFilter === "all") return true;
      return (task.priority || "Medium") === priorityFilter;
    };

    const bySearch = (task: Task) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        (task.description || "").toLowerCase().includes(q) ||
        (task.category?.name || "").toLowerCase().includes(q)
      );
    };

    const filtered = tasks.filter((t) => byStatus(t) && byCategory(t) && byPriority(t) && bySearch(t));

    const getTime = (s?: string | null) => (s ? new Date(s).getTime() : Number.NaN);

    const sorted = [...filtered].sort((a, b) => {
      const aVal = sortBy === "due_date" ? getTime(a.due_date) : getTime(a.created_at);
      const bVal = sortBy === "due_date" ? getTime(b.due_date) : getTime(b.created_at);

      const aMissing = Number.isNaN(aVal);
      const bMissing = Number.isNaN(bVal);

      if (aMissing && bMissing) return 0;
      if (aMissing) return sortDir === "asc" ? 1 : -1;
      if (bMissing) return sortDir === "asc" ? -1 : 1;

      if (aVal === bVal) return 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [tasks, statusFilter, categoryFilter, priorityFilter, search, sortBy, sortDir]);

  const openEditModal = (task: Task) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditStatus(task.status);
    setEditCategoryId(task.category?.category_id ?? "");
    setEditPriority((task.priority as TaskPriority) || "Medium");
    const localIsoString = task.due_date
      ? (() => {
          const s = task.due_date.trim();
          const match = s.match(
            /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/
          );
          if (!match) return "";
          const [ , year, month, day, hour = "00", minute = "00" ] = match;
          return `${year}-${month}-${day}T${hour}:${minute}`;
        })()
      : "";

    setEditDueDate(localIsoString);

  };

  const closeEditModal = () => {
    setEditTask(null);
  };

  const handleUpdateTask = async () => {
    if (!editTask) return;
    setEditLoading(true);
    try {
      const body: any = {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        user_id: Number(user?.userId || 0),
        category_id: editCategoryId === "" ? 0 : Number(editCategoryId),
        priority: editPriority,
      };

      if (editDueDate) {
        body.due_date = new Date(editDueDate).toISOString();
      } else {
        body.due_date = null;
      }

      if (editStatus === "Done") {
        body.completed_at = new Date().toISOString();
      } else {
        body.completed_at = null;
      }

      await api.put(`/tasks/${editTask.id}`, body);
      await fetchTasks();
      closeEditModal();
    } catch (err) {
      console.error("Gagal update task:", err);
      alert("Gagal update task");
    } finally {
      setEditLoading(false);
    }
  };

  const toggleDone = async (task: Task) => {
    try {
      await api.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description || "",
        status: "Done",
        user_id: Number(user?.userId || 0),
        category_id: Number(task.category?.category_id || 0),
        priority: task.priority || "Medium",
        due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
        completed_at: new Date().toISOString(),
      });
      await fetchTasks();
    } catch (err) {
      console.error("Gagal mengubah status task:", err);
      alert("Gagal mengubah status task");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await fetchTasks();
    } catch (err) {
      console.error("Gagal menghapus task:", err);
      alert("Gagal menghapus task");
    }
  };

  const clearFilter = (type: "status" | "category" | "priority") => {
    if (type === "status") setStatusFilter("active");
    if (type === "category") setCategoryFilter("all");
    if (type === "priority") setPriorityFilter("all");
  };

  const categoryStyle = (color?: string) => {
    const bg = color || "#e5e7eb";
    return {
      backgroundColor: bg,
    } as React.CSSProperties;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="p-3 sm:p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold dark:text-gray-100">Task List</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <AddTask onTaskAdded={fetchTasks} />

          <input
            type="text"
            placeholder="Search task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-3 py-2 w-full sm:w-48 lg:w-56 outline-none focus:border-purple-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:border-purple-500"
          />

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="border rounded-xl px-3 py-2 outline-none focus:border-purple-600 flex-1 sm:flex-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:border-purple-500"
            >
              <option value="due_date">Sort by Due Date</option>
              <option value="created_at">Sort by Created At</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
              className="border rounded-xl px-3 py-2 outline-none focus:border-purple-600 flex-1 sm:flex-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:border-purple-500"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>

          <div className="relative">
            <button
              onClick={() => setFiltersOpen((s) => !s)}
              className="border rounded-xl px-3 py-2 hover:bg-gray-50 w-full sm:w-auto dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Filters
            </button>
            {filtersOpen && (
              <div className="absolute right-0 sm:right-auto sm:-translate-x-full mt-2 w-full sm:w-80 bg-white border rounded-xl shadow-lg p-3 z-101 dark:bg-gray-800 dark:border-gray-700">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <option value="active">Active (exclude Done)</option>
                      <option value="all">All (include Done)</option>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="pending">Pending</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) =>
                        setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                      }
                      className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) =>
                        setPriorityFilter(
                          e.target.value === "all" ? "all" : (e.target.value as TaskPriority)
                        )
                      }
                      className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <option value="all">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(statusFilter !== "active" || categoryFilter !== "all" || priorityFilter !== "all" || search) && (
            <button
              onClick={() => {
                setStatusFilter("active");
                setCategoryFilter("all");
                setPriorityFilter("all");
                setSearch("");
              }}
              className="text-sm px-3 py-2 border rounded-xl hover:bg-gray-50 w-full sm:w-auto dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilter !== "active" && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            Status: {statusFilter}
            <button
              onClick={() => clearFilter("status")}
              className="ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/60 px-2"
            >
              ×
            </button>
          </span>
        )}

        {categoryFilter !== "all" && (
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-gray-900 dark:text-gray-100"
            style={categoryStyle(categories.find((c) => c.category_id === categoryFilter)?.color)}
          >
            Category: {categories.find((c) => c.category_id === categoryFilter)?.name || "Unknown"}
            <button
              onClick={() => clearFilter("category")}
              className="ml-1 rounded-full hover:bg-black/10 px-2"
            >
              ×
            </button>
          </span>
        )}

        {priorityFilter !== "all" && (
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              priorityFilter === "High"
                ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                : priorityFilter === "Medium"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Priority: {priorityFilter}
            <button onClick={() => clearFilter("priority")} className="ml-1 rounded-full px-2 hover:bg-black/10">
              ×
            </button>
          </span>
        )}

        {search && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
            Search: "{search}"
            <button
              onClick={() => setSearch("")}
              className="ml-1 rounded-full px-2 hover:bg-purple-200 dark:hover:bg-purple-800/60"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {loadingTasks ? (
        <div className="dark:text-gray-400">Loading tasks...</div>
      ) : visibleTasks.length === 0 ? (
        <p className="dark:text-gray-400">No tasks available.</p>
      ) : (
        <ul className="space-y-3">
          {visibleTasks.map((task) => (
            <li
              key={task.id}
              className="p-3 sm:p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 dark:bg-gray-800 dark:border-gray-700"
            >
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 accent-purple-600 flex-shrink-0"
                  checked={task.status === "Done"}
                  onChange={() => {
                    if (task.status !== "Done") toggleDone(task);
                  }}
                  disabled={task.status === "Done"}
                  title={task.status === "Done" ? "Task already done" : "Mark as done"}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base sm:text-lg break-words dark:text-gray-100">{task.title}</h2>

                  {task.category && (
                    <div className="mt-1">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-black/80 dark:text-white/90"
                        style={categoryStyle(task.category.color)}
                        title={task.category.name}
                      >
                        {task.category.name}
                      </span>
                    </div>
                  )}

                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1 break-words dark:text-gray-400">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.status === "Done"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-300"
                          : task.status === "Todo" || task.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/70 dark:text-yellow-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300"
                      }`}
                    >
                      {task.status}
                    </span>

                    {task.priority && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === "High"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/70 dark:text-red-300"
                            : task.priority === "Medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}

                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {task.due_date
                      ? `Due: ${formatDateFromDB(task.due_date)}`
                      : "No due date"}

                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                <button
                  onClick={() => openEditModal(task)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-101 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-gray-100">Edit Task</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Title"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Description</label>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                  className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Category</label>
                <select
                  value={editCategoryId === "" ? "" : Number(editCategoryId)}
                  onChange={(e) =>
                    setEditCategoryId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="">— Select category —</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1 dark:text-gray-300">Due date</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:[color-scheme:dark]"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 order-2 sm:order-1 dark:bg-gray-600 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 order-1 sm:order-2"
                  disabled={editLoading}
                >
                  {editLoading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
