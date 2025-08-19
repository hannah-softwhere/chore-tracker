'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, DollarSign, Target, Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, addWeeks, addMonths, isBefore, isAfter, startOfWeek, endOfWeek, subDays, subWeeks, subMonths, startOfDay } from 'date-fns';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'one-time';
type CompletedFilter = 'all' | 'week' | 'month' | '3months';

interface ChoreTemplate {
  id: string;
  title: string;
  amount: number;
  frequency: Frequency;
  createdAt: Date;
  isActive: boolean;
}

interface ChoreInstance {
  id: string;
  templateId: string;
  title: string;
  amount: number;
  frequency: Frequency;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

interface Payout {
  id: string;
  amount: number;
  date: Date;
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

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('choreTemplates');
    if (savedTemplates) {
      const parsedTemplates = JSON.parse(savedTemplates).map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt)
      }));
      setChoreTemplates(parsedTemplates);
    }

    const savedInstances = localStorage.getItem('choreInstances');
    if (savedInstances) {
      const parsedInstances = JSON.parse(savedInstances).map((instance: any) => ({
        ...instance,
        dueDate: new Date(instance.dueDate),
        completedAt: instance.completedAt ? new Date(instance.completedAt) : undefined
      }));
      setChoreInstances(parsedInstances);
    }

    const savedPayouts = localStorage.getItem('payouts');
    if (savedPayouts) {
      const parsedPayouts = JSON.parse(savedPayouts).map((payout: any) => ({
        ...payout,
        date: new Date(payout.date)
      }));
      setPayouts(parsedPayouts);
    }
  }, []);

  // Calculate total earned whenever chore instances change
  useEffect(() => {
    const total = choreInstances
      .filter((instance: ChoreInstance) => instance.completed)
      .reduce((sum: number, instance: ChoreInstance) => sum + instance.amount, 0);
    setTotalEarned(total);
  }, [choreInstances]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('choreTemplates', JSON.stringify(choreTemplates));
  }, [choreTemplates]);

  useEffect(() => {
    localStorage.setItem('choreInstances', JSON.stringify(choreInstances));
  }, [choreInstances]);

  useEffect(() => {
    localStorage.setItem('payouts', JSON.stringify(payouts));
  }, [payouts]);

  const generateChoreInstances = (template: ChoreTemplate, startDate: Date, count: number = 30) => {
    const instances: ChoreInstance[] = [];
    let currentDate = startOfDay(startDate);

    for (let i = 0; i < count; i++) {
      const instance: ChoreInstance = {
        id: crypto.randomUUID(),
        templateId: template.id,
        title: template.title,
        amount: template.amount,
        frequency: template.frequency,
        dueDate: new Date(currentDate),
        completed: false
      };
      instances.push(instance);

      // Calculate next due date based on frequency
      switch (template.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'one-time':
          // Only create one instance for one-time chores
          break;
      }

      // Stop creating instances for one-time chores after the first one
      if (template.frequency === 'one-time') break;
    }

    return instances;
  };

  const addChore = () => {
    if (!newChoreTitle.trim() || !newChoreAmount.trim()) return;
    
    const amount = parseFloat(newChoreAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Parse the date string and create a date in local timezone
    const [year, month, day] = newChoreStartDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day); // month is 0-indexed
    if (isNaN(startDate.getTime())) return;

    const template: ChoreTemplate = {
      id: crypto.randomUUID(),
      title: newChoreTitle.trim(),
      amount: amount,
      frequency: newChoreFrequency,
      createdAt: new Date(),
      isActive: true
    };

    // Generate initial instances starting from the selected date
    const instances = generateChoreInstances(template, startDate);

    setChoreTemplates((prev: ChoreTemplate[]) => [...prev, template]);
    setChoreInstances((prev: ChoreInstance[]) => [...prev, ...instances]);
    
    setNewChoreTitle('');
    setNewChoreAmount('');
    setNewChoreFrequency('daily');
    setNewChoreStartDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const completeChoreInstance = (instanceId: string) => {
    setChoreInstances((prev: ChoreInstance[]) => 
      prev.map((instance: ChoreInstance) => {
        if (instance.id === instanceId) {
          return {
            ...instance,
            completed: true,
            completedAt: new Date()
          };
        }
        return instance;
      })
    );
  };

  const uncompleteChoreInstance = (instanceId: string) => {
    setChoreInstances((prev: ChoreInstance[]) => 
      prev.map((instance: ChoreInstance) => {
        if (instance.id === instanceId) {
          return {
            ...instance,
            completed: false,
            completedAt: undefined
          };
        }
        return instance;
      })
    );
  };

  const deleteChoreTemplate = (templateId: string) => {
    setChoreTemplates((prev: ChoreTemplate[]) => 
      prev.filter((template: ChoreTemplate) => template.id !== templateId)
    );
    setChoreInstances((prev: ChoreInstance[]) => 
      prev.filter((instance: ChoreInstance) => instance.templateId !== templateId)
    );
  };

  const deleteChoreInstance = (instanceId: string) => {
    setChoreInstances((prev: ChoreInstance[]) => 
      prev.filter((instance: ChoreInstance) => instance.id !== instanceId)
    );
  };

  const updateChoreAmount = (templateId: string, newAmount: number) => {
    // Update the template amount
    setChoreTemplates((prev: ChoreTemplate[]) => 
      prev.map((template: ChoreTemplate) => 
        template.id === templateId 
          ? { ...template, amount: newAmount }
          : template
      )
    );

    // Update all future instances (not completed and due date is in the future)
    const today = startOfDay(new Date());
    setChoreInstances((prev: ChoreInstance[]) => 
      prev.map((instance: ChoreInstance) => {
        if (instance.templateId === templateId && !instance.completed && isAfter(instance.dueDate, today)) {
          return { ...instance, amount: newAmount };
        }
        return instance;
      })
    );

    setEditingAmount(null);
    setEditingTemplateId(null);
  };

  const getScheduleData = () => {
    const today = startOfDay(new Date());
    const scheduleData: { [key in Frequency]: Array<{
      template: ChoreTemplate;
      nextDueDate: Date | null;
      lastCompletedDate: Date | null;
      totalEarned: number;
    }> } = {
      'one-time': [],
      'daily': [],
      'weekly': [],
      'monthly': []
    };

    choreTemplates.forEach((template: ChoreTemplate) => {
      if (!template.isActive) return;

      // Get all instances for this template
      const instances = choreInstances.filter((instance: ChoreInstance) => 
        instance.templateId === template.id
      );

      // Find next due date (earliest uncompleted instance)
      const nextDueInstance = instances
        .filter((instance: ChoreInstance) => !instance.completed)
        .sort((a: ChoreInstance, b: ChoreInstance) => a.dueDate.getTime() - b.dueDate.getTime())[0];

      // Find last completed date
      const lastCompletedInstance = instances
        .filter((instance: ChoreInstance) => instance.completed)
        .sort((a: ChoreInstance, b: ChoreInstance) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

      // Calculate total earned from this template
      const totalEarned = instances
        .filter((instance: ChoreInstance) => instance.completed)
        .reduce((sum: number, instance: ChoreInstance) => sum + instance.amount, 0);

      scheduleData[template.frequency].push({
        template,
        nextDueDate: nextDueInstance?.dueDate || null,
        lastCompletedDate: lastCompletedInstance?.completedAt || null,
        totalEarned
      });
    });

    return scheduleData;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1)
    );
  };

  const getChoresForSelectedDate = () => {
    return choreInstances.filter((instance: ChoreInstance) => {
      if (instance.completed) return false;
      return isSameDay(instance.dueDate, selectedDate);
    });
  };

  const getCompletedChoresForSelectedDate = () => {
    return choreInstances.filter((instance: ChoreInstance) => {
      if (!instance.completed) return false;
      return isSameDay(instance.completedAt!, selectedDate);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addChore();
    }
  };

  const handlePayout = () => {
    if (totalEarned <= 0) return;

    const newPayout: Payout = {
      id: crypto.randomUUID(),
      amount: totalEarned,
      date: new Date()
    };

    setPayouts((prev: Payout[]) => [...prev, newPayout]);
    setTotalEarned(0);
    setShowPayoutModal(false);
  };

  const getDueChoreInstances = () => {
    const today = startOfDay(new Date());
    return choreInstances.filter((instance: ChoreInstance) => 
      !instance.completed && (isBefore(instance.dueDate, today) || isSameDay(instance.dueDate, today))
    );
  };

  const getChoresForDate = (date: Date): ChoreInstance[] => {
    return choreInstances.filter((instance: ChoreInstance) => {
      if (instance.completed) return false;
      return isSameDay(instance.dueDate, date);
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
          instance.completedAt && isAfter(instance.completedAt, weekAgo)
        );
      case 'month':
        const monthAgo = subMonths(now, 1);
        return completedInstances.filter((instance: ChoreInstance) => 
          instance.completedAt && isAfter(instance.completedAt, monthAgo)
        );
      case '3months':
        const threeMonthsAgo = subMonths(now, 3);
        return completedInstances.filter((instance: ChoreInstance) => 
          instance.completedAt && isAfter(instance.completedAt, threeMonthsAgo)
        );
      default:
        return completedInstances;
    }
  };

  const dueChoreInstances = getDueChoreInstances();
  const completedChoreInstances = choreInstances.filter((instance: ChoreInstance) => instance.completed);
  const filteredCompletedChores = getFilteredCompletedChores();

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
            <button
              onClick={() => setView('schedule')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                view === 'schedule' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </div>
        </div>

        {/* Add New Chore Form */}
        {view !== 'payouts' && view !== 'completed' && view !== 'schedule' && (
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
                  onKeyPress={handleKeyPress}
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
                  onKeyPress={handleKeyPress}
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
                          <span>Due: {format(instance.dueDate, 'MMM d, yyyy')}</span>
                          <span className="capitalize">{instance.frequency === 'one-time' ? 'One Time' : instance.frequency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-green-600">
                          ${instance.amount.toFixed(2)}
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
                          <span>Completed: {instance.completedAt ? format(instance.completedAt, 'MMM d, yyyy \'at\' h:mm a') : 'Unknown'}</span>
                          <span className="capitalize">{instance.frequency === 'one-time' ? 'One Time' : instance.frequency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-green-600">
                          ${instance.amount.toFixed(2)}
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
                          title={`${instance.title} - $${instance.amount.toFixed(2)}`}
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
        ) : view === 'schedule' ? (
          /* Schedule View */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Chore Schedule
            </h2>
            
            {(() => {
              const scheduleData = getScheduleData();
              const hasAnyChores = Object.values(scheduleData).some(chores => chores.length > 0);
              
              if (!hasAnyChores) {
                return (
                  <p className="text-gray-500 text-center py-8">
                    No active chores found. Add some chores to see them in your schedule!
                  </p>
                );
              }

              return (
                <div className="space-y-8">
                  {/* One Time Chores */}
                  {scheduleData['one-time'].length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">One Time Chores</h3>
                      <div className="space-y-3">
                        {scheduleData['one-time'].map(({ template, nextDueDate, lastCompletedDate, totalEarned }) => (
                          <div key={template.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{template.title}</h4>
                              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                {nextDueDate && (
                                  <span>Next Due: {format(nextDueDate, 'MMM d, yyyy')}</span>
                                )}
                                {lastCompletedDate && (
                                  <span>Last Completed: {format(lastCompletedDate, 'MMM d, yyyy')}</span>
                                )}
                                {totalEarned > 0 && (
                                  <span>Total Earned: ${totalEarned.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {editingTemplateId === template.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editingAmount || ''}
                                    onChange={(e) => setEditingAmount(e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                    min="0"
                                    step="0.01"
                                  />
                                  <button
                                    onClick={() => updateChoreAmount(template.id, parseFloat(editingAmount || '0'))}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(null);
                                      setEditingTemplateId(null);
                                    }}
                                    className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold text-green-600">
                                    ${template.amount.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(template.amount.toString());
                                      setEditingTemplateId(template.id);
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit amount"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Chores */}
                  {scheduleData['daily'].length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Chores</h3>
                      <div className="space-y-3">
                        {scheduleData['daily'].map(({ template, nextDueDate, lastCompletedDate, totalEarned }) => (
                          <div key={template.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{template.title}</h4>
                              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                {nextDueDate && (
                                  <span>Next Due: {format(nextDueDate, 'MMM d, yyyy')}</span>
                                )}
                                {lastCompletedDate && (
                                  <span>Last Completed: {format(lastCompletedDate, 'MMM d, yyyy')}</span>
                                )}
                                {totalEarned > 0 && (
                                  <span>Total Earned: ${totalEarned.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {editingTemplateId === template.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editingAmount || ''}
                                    onChange={(e) => setEditingAmount(e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                    min="0"
                                    step="0.01"
                                  />
                                  <button
                                    onClick={() => updateChoreAmount(template.id, parseFloat(editingAmount || '0'))}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(null);
                                      setEditingTemplateId(null);
                                    }}
                                    className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold text-green-600">
                                    ${template.amount.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(template.amount.toString());
                                      setEditingTemplateId(template.id);
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit amount"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Chores */}
                  {scheduleData['weekly'].length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Chores</h3>
                      <div className="space-y-3">
                        {scheduleData['weekly'].map(({ template, nextDueDate, lastCompletedDate, totalEarned }) => (
                          <div key={template.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{template.title}</h4>
                              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                {nextDueDate && (
                                  <span>Next Due: {format(nextDueDate, 'MMM d, yyyy')}</span>
                                )}
                                {lastCompletedDate && (
                                  <span>Last Completed: {format(lastCompletedDate, 'MMM d, yyyy')}</span>
                                )}
                                {totalEarned > 0 && (
                                  <span>Total Earned: ${totalEarned.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {editingTemplateId === template.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editingAmount || ''}
                                    onChange={(e) => setEditingAmount(e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                    min="0"
                                    step="0.01"
                                  />
                                  <button
                                    onClick={() => updateChoreAmount(template.id, parseFloat(editingAmount || '0'))}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(null);
                                      setEditingTemplateId(null);
                                    }}
                                    className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold text-green-600">
                                    ${template.amount.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(template.amount.toString());
                                      setEditingTemplateId(template.id);
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit amount"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Chores */}
                  {scheduleData['monthly'].length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Chores</h3>
                      <div className="space-y-3">
                        {scheduleData['monthly'].map(({ template, nextDueDate, lastCompletedDate, totalEarned }) => (
                          <div key={template.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{template.title}</h4>
                              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                {nextDueDate && (
                                  <span>Next Due: {format(nextDueDate, 'MMM d, yyyy')}</span>
                                )}
                                {lastCompletedDate && (
                                  <span>Last Completed: {format(lastCompletedDate, 'MMM d, yyyy')}</span>
                                )}
                                {totalEarned > 0 && (
                                  <span>Total Earned: ${totalEarned.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {editingTemplateId === template.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editingAmount || ''}
                                    onChange={(e) => setEditingAmount(e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                    min="0"
                                    step="0.01"
                                  />
                                  <button
                                    onClick={() => updateChoreAmount(template.id, parseFloat(editingAmount || '0'))}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(null);
                                      setEditingTemplateId(null);
                                    }}
                                    className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold text-green-600">
                                    ${template.amount.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingAmount(template.amount.toString());
                                      setEditingTemplateId(template.id);
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit amount"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
                        <span>Completed: {instance.completedAt ? format(instance.completedAt, 'MMM d, yyyy \'at\' h:mm a') : 'Unknown'}</span>
                        <span className="capitalize">{instance.frequency === 'one-time' ? 'One Time' : instance.frequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-green-600">
                        ${instance.amount.toFixed(2)}
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
                          {format(payout.date, 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-green-600">
                        ${payout.amount.toFixed(2)}
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
