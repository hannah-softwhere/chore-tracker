'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, DollarSign, Target, Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, addWeeks, addMonths, isBefore, isAfter, startOfWeek, endOfWeek, subDays, subWeeks, subMonths, startOfDay } from 'date-fns';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'one-time';
type CompletedFilter = 'all' | 'week' | 'month' | '3months';

interface ChoreTemplate {
  id: string;
  title: string;
  amount: string;
  frequency: Frequency;
  createdAt: string;
  isActive: boolean;
}

interface ChoreInstance {
  id: string;
  templateId: string;
  title: string;
  amount: string;
  frequency: Frequency;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

interface Payout {
  id: string;
  amount: string;
  date: string;
}

export default function ChoreTracker() {
  const [choreTemplates, setChoreTemplates] = useState<ChoreTemplate[]>([]);
  const [choreInstances, setChoreInstances] = useState<ChoreInstance[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [newChoreTitle, setNewChoreTitle] = useState('');
  const [newChoreAmount, setNewChoreAmount] = useState('');
  const [newChoreFrequency, setNewChoreFrequency] = useState<Frequency>('daily');
  const [newChoreStartDate, setNewChoreStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [totalEarned, setTotalEarned] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'list' | 'calendar' | 'payouts' | 'completed' | 'schedule'>('list');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [completedFilter, setCompletedFilter] = useState<CompletedFilter>('all');
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Load data from API on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load chore templates
      const templatesResponse = await fetch('/api/chores');
      const templates = await templatesResponse.json();
      setChoreTemplates(templates);

      // Load chore instances
      const instancesResponse = await fetch('/api/instances');
      const instances = await instancesResponse.json();
      setChoreInstances(instances);

      // Load payouts
      const payoutsResponse = await fetch('/api/payouts');
      const payoutsData = await payoutsResponse.json();
      setPayouts(payoutsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total earned whenever chore instances change
  useEffect(() => {
    const total = choreInstances
      .filter((instance: ChoreInstance) => instance.completed)
      .reduce((sum: number, instance: ChoreInstance) => sum + parseFloat(instance.amount), 0);
    setTotalEarned(total);
  }, [choreInstances]);

  const addChore = async () => {
    if (!newChoreTitle.trim() || !newChoreAmount.trim()) return;
    
    const amount = parseFloat(newChoreAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newChoreTitle.trim(),
          amount: newChoreAmount,
          frequency: newChoreFrequency,
          startDate: newChoreStartDate,
        }),
      });

      if (response.ok) {
        // Reload data to get the new chore and its instances
        await loadData();
        
        // Reset form
        setNewChoreTitle('');
        setNewChoreAmount('');
        setNewChoreFrequency('daily');
        setNewChoreStartDate(format(new Date(), 'yyyy-MM-dd'));
      } else {
        console.error('Failed to create chore');
      }
    } catch (error) {
      console.error('Error creating chore:', error);
    }
  };

  const completeChoreInstance = async (instanceId: string) => {
    try {
      const response = await fetch('/api/instances', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: instanceId,
          action: 'complete',
        }),
      });

      if (response.ok) {
        // Reload instances to get updated data
        const instancesResponse = await fetch('/api/instances');
        const instances = await instancesResponse.json();
        setChoreInstances(instances);
      }
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  };

  const uncompleteChoreInstance = async (instanceId: string) => {
    try {
      const response = await fetch('/api/instances', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: instanceId,
          action: 'uncomplete',
        }),
      });

      if (response.ok) {
        // Reload instances to get updated data
        const instancesResponse = await fetch('/api/instances');
        const instances = await instancesResponse.json();
        setChoreInstances(instances);
      }
    } catch (error) {
      console.error('Error uncompleting chore:', error);
    }
  };

  const deleteChoreInstance = async (instanceId: string) => {
    try {
      const response = await fetch('/api/instances', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: instanceId,
        }),
      });

      if (response.ok) {
        // Reload instances to get updated data
        const instancesResponse = await fetch('/api/instances');
        const instances = await instancesResponse.json();
        setChoreInstances(instances);
      }
    } catch (error) {
      console.error('Error deleting chore instance:', error);
    }
  };

  const handlePayout = async () => {
    if (totalEarned <= 0) return;

    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalEarned.toString(),
          notes: 'Payout from chore tracker',
        }),
      });

      if (response.ok) {
        // Reload data to get updated payouts
        await loadData();
        setShowPayoutModal(false);
      }
    } catch (error) {
      console.error('Error creating payout:', error);
    }
  };

  const getDueChoreInstances = () => {
    const today = startOfDay(new Date());
    return choreInstances.filter((instance: ChoreInstance) => 
      !instance.completed && (isBefore(new Date(instance.dueDate), today) || isSameDay(new Date(instance.dueDate), today))
    );
  };

  const getChoresForDate = (date: Date): ChoreInstance[] => {
    return choreInstances.filter((instance: ChoreInstance) => {
      if (instance.completed) return false;
      return isSameDay(new Date(instance.dueDate), date);
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1)
    );
  };

  const getChoresForSelectedDate = () => {
    return choreInstances.filter((instance: ChoreInstance) => {
      if (instance.completed) return false;
      return isSameDay(new Date(instance.dueDate), selectedDate);
    });
  };

  const getCompletedChoresForSelectedDate = () => {
    return choreInstances.filter((instance: ChoreInstance) => {
      if (!instance.completed) return false;
      return isSameDay(new Date(instance.completedAt!), selectedDate);
    });
  };

  const getCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days from previous month
    const startOfFirstWeek = startOfWeek(start);
    const endOfLastWeek = endOfWeek(end);
    return eachDayOfInterval({ start: startOfFirstWeek, end: endOfLastWeek });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? addMonths(prev, -1) : addMonths(prev, 1)
    );
  };

  const getFilteredCompletedChores = () => {
    const completedInstances = choreInstances.filter((instance: ChoreInstance) => instance.completed);
    const now = new Date();

    switch (completedFilter) {
      case 'week':
        const weekAgo = subDays(now, 7);
        return completedInstances.filter((instance: ChoreInstance) => 
          instance.completedAt && isAfter(new Date(instance.completedAt), weekAgo)
        );
      case 'month':
        const monthAgo = subMonths(now, 1);
        return completedInstances.filter((instance: ChoreInstance) => 
          instance.completedAt && isAfter(new Date(instance.completedAt), monthAgo)
        );
      case '3months':
        const threeMonthsAgo = subMonths(now, 3);
        return completedInstances.filter((instance: ChoreInstance) => 
          instance.completedAt && isAfter(new Date(instance.completedAt), threeMonthsAgo)
        );
      default:
        return completedInstances;
    }
  };

  const dueChoreInstances = getDueChoreInstances();
  const completedChoreInstances = choreInstances.filter((instance: ChoreInstance) => instance.completed);
  const filteredCompletedChores = getFilteredCompletedChores();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your chores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Money Earned Tracker */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Chore Tracker
              </h1>
              <p className="text-gray-600">Track your chores and earnings</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
                <DollarSign className="w-8 h-8" />
                <span>{totalEarned.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Total Earned</p>
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={totalEarned <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Pay Out
              </button>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                view === 'calendar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar View
            </button>
            <button
              onClick={() => setView('completed')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                view === 'completed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Check className="w-4 h-4" />
              Completed Chores
            </button>
            <button
              onClick={() => setView('payouts')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                view === 'payouts' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Payout History
            </button>
          </div>
        </div>

        {/* Add New Chore Form */}
        {view !== 'payouts' && view !== 'completed' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Chore
            </h2>
            <div className="flex gap-4 flex-col lg:flex-row">
              <div className="flex-1">
                <label htmlFor="chore-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Chore Description
                </label>
                <input
                  id="chore-title"
                  type="text"
                  value={newChoreTitle}
                  onChange={(e) => setNewChoreTitle(e.target.value)}
                  placeholder="e.g., Clean the kitchen, Take out trash..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                />
              </div>
              <div className="lg:w-32">
                <label htmlFor="chore-amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  id="chore-amount"
                  type="number"
                  value={newChoreAmount}
                  onChange={(e) => setNewChoreAmount(e.target.value)}
                  placeholder="5.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                />
              </div>
              <div className="lg:w-40">
                <label htmlFor="chore-frequency" className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  id="chore-frequency"
                  value={newChoreFrequency}
                  onChange={(e) => setNewChoreFrequency(e.target.value as Frequency)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="one-time">One Time</option>
                </select>
              </div>
              <div className="lg:w-40">
                <label htmlFor="chore-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                  First Due Date
                </label>
                <input
                  id="chore-start-date"
                  type="date"
                  value={newChoreStartDate}
                  onChange={(e) => setNewChoreStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addChore}
                  disabled={!newChoreTitle.trim() || !newChoreAmount.trim()}
                  className="w-full lg:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Chore
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'list' ? (
          <>
            {/* Date Navigation Header */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                  {isSameDay(selectedDate, new Date()) 
                    ? 'Today' 
                    : format(selectedDate, 'EEEE, MMMM d, yyyy')
                  }
                </h3>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pending Chores */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Due Chores ({getChoresForSelectedDate().length})
              </h2>
              {getChoresForSelectedDate().length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {isSameDay(selectedDate, new Date()) 
                    ? "No chores due today! Add some above." 
                    : `No chores due on ${format(selectedDate, 'MMMM d, yyyy')}.`
                  }
                </p>
              ) : (
                <div className="space-y-3">
                  {getChoresForSelectedDate().map((instance) => (
                    <div
                      key={instance.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => completeChoreInstance(instance.id)}
                        className="w-6 h-6 border-2 border-gray-300 rounded-full hover:border-blue-500 transition-colors flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white hidden" />
                      </button>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{instance.title}</h3>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>Due: {format(new Date(instance.dueDate), 'MMM d, yyyy')}</span>
                          <span className="capitalize">{instance.frequency === 'one-time' ? 'One Time' : instance.frequency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-green-600">
                          ${parseFloat(instance.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteChoreInstance(instance.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Chores */}
            {getCompletedChoresForSelectedDate().length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Completed Chores ({getCompletedChoresForSelectedDate().length})
                </h2>
                <div className="space-y-3">
                  {getCompletedChoresForSelectedDate().map((instance) => (
                    <div
                      key={instance.id}
                      className="flex items-center gap-4 p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                      onClick={() => uncompleteChoreInstance(instance.id)}
                      title="Click to uncomplete this chore"
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{instance.title}</h3>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>Completed: {instance.completedAt ? format(new Date(instance.completedAt), 'MMM d, yyyy \'at\' h:mm a') : 'Unknown'}</span>
                          <span className="capitalize">{instance.frequency === 'one-time' ? 'One Time' : instance.frequency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-green-600">
                          ${parseFloat(instance.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChoreInstance(instance.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete this chore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : view === 'calendar' ? (
          /* Calendar View */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendar View
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getCalendarDays().map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = isSameDay(day, new Date());
                const dayChores = getChoresForDate(day);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-gray-200 ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Chores for this day */}
                    <div className="space-y-1">
                      {dayChores.slice(0, 2).map((instance) => (
                        <div
                          key={instance.id}
                          className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                          title={`${instance.title} - $${parseFloat(instance.amount).toFixed(2)}`}
                          onClick={() => completeChoreInstance(instance.id)}
                        >
                          {instance.title}
                        </div>
                      ))}
                      {dayChores.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayChores.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'completed' ? (
          /* Completed Chores View */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Completed Chores History
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompletedFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    completedFilter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setCompletedFilter('3months')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    completedFilter === '3months' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 3 Months
                </button>
                <button
                  onClick={() => setCompletedFilter('month')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    completedFilter === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last Month
                </button>
                <button
                  onClick={() => setCompletedFilter('week')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    completedFilter === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last Week
                </button>
              </div>
            </div>

            {filteredCompletedChores.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {completedChoreInstances.length === 0 
                  ? "No completed chores yet. Complete some chores to see them here!" 
                  : `No chores completed in the selected time period.`
                }
              </p>
            ) : (
              <div className="space-y-3">
                {filteredCompletedChores.map((instance) => (
                  <div
                    key={instance.id}
                    className="flex items-center gap-4 p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => uncompleteChoreInstance(instance.id)}
                    title="Click to uncomplete this chore"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{instance.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Completed: {instance.completedAt ? format(new Date(instance.completedAt), 'MMM d, yyyy \'at\' h:mm a') : 'Unknown'}</span>
                        <span className="capitalize">{instance.frequency === 'one-time' ? 'One Time' : instance.frequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-green-600">
                        ${parseFloat(instance.amount).toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChoreInstance(instance.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete this chore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Payout History View */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payout History
            </h2>
            {payouts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payouts yet. Complete some chores and use the Pay Out button!</p>
            ) : (
              <div className="space-y-3">
                {payouts.slice().reverse().map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Payout</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(payout.date), 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-green-600">
                        ${parseFloat(payout.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payout Confirmation Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Confirm Payout</h3>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to pay out <span className="font-semibold text-green-600">${totalEarned.toFixed(2)}</span>? 
                This will reset your total earned to $0.00.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayout}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
