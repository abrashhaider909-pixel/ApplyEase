import type { Application } from '../types';

/** Keep locally cached applications that are absent from a cloud snapshot. */
export function mergeCloudApplications(
  cloudApplications: Application[],
  localApplications: Application[]
): { applications: Application[]; localOnlyApplications: Application[] } {
  const cloudIds = new Set(cloudApplications.map(application => application.id));
  const localOnlyApplications = localApplications.filter(application => !cloudIds.has(application.id));

  return {
    applications: [...cloudApplications, ...localOnlyApplications],
    localOnlyApplications
  };
}
