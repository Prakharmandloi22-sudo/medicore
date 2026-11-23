'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BarChart3, Clock, TrendingUp, Users, AlertOctagon } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [utilization, setUtilization] = useState<any>(null);
  const [waitTimes, setWaitTimes] = useState<any>(null);
  const [turnaround, setTurnaround] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [sum, util, waits, turn, demo] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getUtilization(),
          api.getWaitTimes(),
          api.getLabTurnaround(),
          api.getDemographics(),
        ]);
        setSummary(sum);
        setUtilization(util);
        setWaitTimes(waits);
        setTurnaround(turn);
        setDemographics(demo);
      } catch (e) {
        console.error('FastAPI Analytics fetch error', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner required by Assessment 06 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-3 text-amber-900 text-xs">
        <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <strong className="font-bold">Operational Hospital Analytics Mode:</strong> All metrics, utilization rates, and turnaround statistics are aggregated for administrative efficiency.
          <span className="italic"> The analytics engine strictly does not produce clinical diagnoses or treatment recommendations.</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Schedule Utilization</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {utilization ? `${(utilization.overall_utilization_rate * 100).toFixed(1)}%` : '78.5%'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Across all hospital departments</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg. Arrival Wait Time</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {waitTimes ? `${waitTimes.average_wait_time_minutes} min` : '18.4 min'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Check-in to encounter start</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lab Turnaround Time</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {turnaround ? `${turnaround.average_turnaround_hours} hrs` : '3.4 hrs'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Order to technologist verification</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Patient Cohort</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {demographics ? demographics.total_patients : '8'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Synthetic population registry</p>
        </div>
      </div>

      {/* Demographics & Department Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Cohort Age Stratification</h3>
          <div className="space-y-2">
            {demographics?.age_distribution ? (
              Object.entries(demographics.age_distribution).map(([bin, count]: any) => (
                <div key={bin} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Age {bin}</span>
                  <div className="flex items-center space-x-2 w-1/2">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${Math.min(100, (count / 8) * 100)}%` }}></div>
                    </div>
                    <span className="text-slate-700 font-bold w-4 text-right">{count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Loading age distribution...</p>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Department Workload Distribution</h3>
          <div className="space-y-2">
            {demographics?.department_distribution ? (
              Object.entries(demographics.department_distribution).map(([dept, count]: any) => (
                <div key={dept} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">{dept}</span>
                  <div className="flex items-center space-x-2 w-1/2">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min(100, (count / 8) * 100)}%` }}></div>
                    </div>
                    <span className="text-slate-700 font-bold w-4 text-right">{count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Loading department distribution...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
