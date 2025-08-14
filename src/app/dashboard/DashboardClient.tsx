"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Target,
  AlertTriangle,
  BarChart3,
  Activity
} from "lucide-react";

interface WeatherResponse {
  data: {
    main: { temp: number };
    weather: { main: string; description: string; icon: string }[];
    name: string;
  };
  last_sync: string;
}

interface PriorityStats {
  priority: string;
  count: number;
}

interface CategoryStats {
  category_name: string;
  count: number;
}

interface CompletionStats {
  total: number;
  completed: number;
  completion_rate: number;
}

interface DashboardStats {
  total_tasks: number;
  tasks_by_priority: PriorityStats[];
  tasks_by_category: CategoryStats[];
  completion_stats: CompletionStats;
  tasks_due_today: number;
}

interface StatsResponse {
  data: DashboardStats;
}

export default function DashboardClient() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWeather();
      fetchStats();
    }
  }, [user]);

  const fetchWeather = async () => {
    try {
      const res = await api.get("/dashboard/weather");
      setWeather(res.data);
    } catch (err) {
      console.error("Gagal mengambil data cuaca:", err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`/dashboard/stats/${user?.uid}`);
      setStats(res.data.data);
    } catch (err) {
      console.error("Gagal mengambil statistik:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'from-red-500 to-red-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return <AlertTriangle className="w-6 h-6" />;
      case 'medium': return <Clock className="w-6 h-6" />;
      case 'low': return <CheckCircle2 className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  if (!user) return null;

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome back, {user?.name ?? user?.userId ?? "User"}! 🚀
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Here's what's happening with your tasks today
        </p>
      </div>

      {/* Weather Card */}
      <div className="mb-8">
        {loadingWeather ? (
          <div className="p-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl shadow-lg text-white animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-blue-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-blue-300 rounded mb-2"></div>
                <div className="h-4 bg-blue-300 rounded mb-4"></div>
                <div className="h-12 bg-blue-300 rounded"></div>
              </div>
            </div>
          </div>
        ) : weather ? (
          <div className="p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center gap-6 text-white transform hover:scale-105 transition-transform duration-300">
            <img
              src={`https://openweathermap.org/img/wn/${weather.data.weather[0].icon}@4x.png`}
              alt={weather.data.weather[0].description}
              className="w-24 h-24 drop-shadow-lg animate-bounce"
            />
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{weather.data.name}</h2>
              <p className="text-lg capitalize opacity-90">
                {weather.data.weather[0].description}
              </p>
              <p className="text-6xl font-extrabold mt-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {Math.round(weather.data.main.temp)}°C
              </p>
            </div>
            <div className="text-sm opacity-80 text-right">
              <p>Last update:</p>
              <p>
                {new Date(weather.last_sync).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-red-100 dark:bg-red-900 rounded-2xl border-l-4 border-red-500">
            <p className="text-red-700 dark:text-red-300">❌ Gagal memuat cuaca</p>
          </div>
        )}
      </div>

      {/* Statistics Overview Cards */}
      <div className="mb-8">
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Tasks */}
            <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{stats.total_tasks}</p>
                  <p className="text-purple-100">Total Tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-purple-100">
                <Activity className="w-4 h-4" />
                <span className="text-sm">All your tasks</span>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="p-6 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{stats.completion_stats.completion_rate.toFixed(1)}%</p>
                  <p className="text-green-100">Completed</p>
                </div>
              </div>
              <div className="w-full bg-green-300/30 rounded-full h-2 mb-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-700" 
                  style={{width: `${Math.min(stats.completion_stats.completion_rate, 100)}%`}}
                ></div>
              </div>
              <p className="text-green-100 text-sm">{stats.completion_stats.completed}/{stats.completion_stats.total} tasks done</p>
            </div>

            {/* Tasks Due Today */}
            <div className="p-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{stats.tasks_due_today}</p>
                  <p className="text-orange-100">Due Today</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-orange-100">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Don't miss deadlines!</span>
              </div>
            </div>

            {/* Trending Up */}
            <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {stats.tasks_by_category.length}
                  </p>
                  <p className="text-blue-100">Categories</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <Target className="w-4 h-4" />
                <span className="text-sm">Active categories</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-red-100 dark:bg-red-900 rounded-2xl border-l-4 border-red-500">
            <p className="text-red-700 dark:text-red-300">❌ Gagal memuat statistik</p>
          </div>
        )}
      </div>

      {/* Priority & Category Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Priority Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-yellow-500 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              Tasks by Priority
            </h3>
            <div className="space-y-4">
              {stats.tasks_by_priority.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-r ${getPriorityColor(item.priority)} rounded-xl text-white`}>
                    {getPriorityIcon(item.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white capitalize">
                        {item.priority} Priority
                      </span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full bg-gradient-to-r ${getPriorityColor(item.priority)} transition-all duration-700`}
                        style={{width: `${stats.total_tasks > 0 ? (item.count / stats.total_tasks) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              Tasks by Category
            </h3>
            <div className="space-y-4">
              {stats.tasks_by_category.map((item, index) => {
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600', 
                  'from-pink-500 to-pink-600',
                  'from-indigo-500 to-indigo-600',
                  'from-teal-500 to-teal-600'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-r ${colorClass} rounded-xl text-white`}>
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.category_name || 'Uncategorized'}
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {item.count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700`}
                          style={{width: `${stats.total_tasks > 0 ? (item.count / stats.total_tasks) * 100 : 0}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}