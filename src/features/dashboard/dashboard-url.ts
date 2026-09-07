import { DATE_PRESETS } from '@/shared/date-presets';
import type { DatePreset } from '@/shared/date-presets';
import { GROUP_BY_VALUES, type GroupBy } from '@/shared/dashboard-query';

export type DashboardUrlState = {
  preset?: DatePreset;
  from?: string;
  to?: string;
  groupBy?: GroupBy;
  projectId?: string;
  providerKey?: string;
};

const PRESET_SET = new Set<string>(DATE_PRESETS);
const GROUP_SET = new Set<string>(GROUP_BY_VALUES);

export function readDashboardUrlState(
  params: URLSearchParams | Readonly<URLSearchParams>,
): DashboardUrlState {
  const state: DashboardUrlState = {};
  const preset = params.get('preset');
  if (preset && PRESET_SET.has(preset)) {
    state.preset = preset as DatePreset;
  }
  const from = params.get('from');
  const to = params.get('to');
  if (from) {
    state.from = from;
  }
  if (to) {
    state.to = to;
  }
  const groupBy = params.get('groupBy');
  if (groupBy && GROUP_SET.has(groupBy)) {
    state.groupBy = groupBy as GroupBy;
  }
  const projectId = params.get('projectId');
  if (projectId) {
    state.projectId = projectId;
  }
  const providerKey = params.get('providerKey');
  if (providerKey) {
    state.providerKey = providerKey;
  }
  return state;
}

export function buildDashboardQueryString(state: DashboardUrlState): string {
  const params = new URLSearchParams();
  if (state.preset) {
    params.set('preset', state.preset);
  }
  if (state.from) {
    params.set('from', state.from);
  }
  if (state.to) {
    params.set('to', state.to);
  }
  if (state.groupBy) {
    params.set('groupBy', state.groupBy);
  }
  if (state.projectId) {
    params.set('projectId', state.projectId);
  }
  if (state.providerKey) {
    params.set('providerKey', state.providerKey);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function mergeDashboardUrlState(
  current: DashboardUrlState,
  patch: Partial<DashboardUrlState>,
): DashboardUrlState {
  return { ...current, ...patch };
}
