"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { z } from "zod";

type TaskStatus = "Todo" | "In Progress" | "Done" | "pending";
type TaskPriority = "Low" | "Medium" | "High";

interface Category {
  category_id: number;
  name: string;
  color: string;
}

interface AddTaskProps {
  onTaskAdded?: () => void;
}

const taskSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required." }),
  description: z.string().trim().optional(),
  status: z.enum(["Todo", "In Progress", "Done", "pending"]),
  priority: z.enum(["Low", "Medium", "High"]),
  categoryId: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

type TaskFormSchema = z.infer<typeof taskSchema>;
type FormErrors = z.ZodFormattedError<TaskFormSchema>;

export default function AddTask({ onTaskAdded }: AddTaskProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Todo");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errors, setErrors] = useState<FormErrors | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get("/categories");
      setCategories(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
    resetForm();
  };

  const closeModal = () => {
    if (loading) return;
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("Todo");
    setCategoryId("");
    setPriority("Medium");
    setDueDate("");
    setErrors(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (!user?.userId) {
      alert("User not authenticated!");
      return;
    }

    const validationResult = taskSchema.safeParse({
      title,
      description,
      status,
      priority,
      categoryId: categoryId || undefined,
      dueDate: dueDate || null,
    });

    if (!validationResult.success) {
      setErrors(validationResult.error.format());
      return;
    }

    setLoading(true);

    const { data } = validationResult;

    try {
      const body: any = {
        title: data.title,
        description: data.description,
        status: data.status,
        user_id: Number(user.userId),
        category_id: data.categoryId ? Number(data.categoryId) : 0,
        priority: data.priority,
        due_date: data.dueDate ? new Date(data.dueDate + '+07:00').toISOString() : null,
        completed_at: data.status === "Done" ? new Date(Date.now() + (7 * 60 * 60 * 1000)).toISOString() : null,
      };

      await api.post("/tasks", body);

      alert("Task created successfully!");
      closeModal();

      if (onTaskAdded) {
        onTaskAdded();
      }
    } catch (error: any) {
      console.error("Error creating task:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create task";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="px-3 py-2 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 text-sm sm:text-base"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span className="hidden xs:inline">Add Task</span>
        <span className="xs:hidden">Add</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-101 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl flex flex-col dark:bg-gray-800">
            <div className="sticky top-0 bg-white rounded-t-xl border-b px-4 py-4 sm:px-6 dark:bg-gray-800">
              <div className="flex justify-between items-center dark:bg-gray-800">
                <h2 className="text-lg sm:text-xl font-bold dark:text-gray-100">Add New Task</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  disabled={loading}
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2 dark:text-gray-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base outline-none focus:ring-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 ${
                    errors?.title
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-purple-600 focus:ring-purple-600"
                  }`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  disabled={loading}
                />
                {errors?.title?._errors[0] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title._errors[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  className="w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description (optional)"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                    disabled={loading}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2 dark:text-gray-300">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                    className="w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                    disabled={loading}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  disabled={loading || loadingCategories}
                >
                  <option value="">— Select category (optional) —</option>
                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                {loadingCategories && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading categories...
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2 dark:text-gray-300">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 ark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:[color-scheme:dark]"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm sm:text-base"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Task"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}