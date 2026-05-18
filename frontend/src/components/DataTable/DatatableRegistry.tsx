const refetchDatatable: Record<string, () => void> = {};

export const datatableRefetchRegistry = {
  set: (key: string, refetchFn: () => void) => {
    refetchDatatable[key] = refetchFn;
  },
  get: (key: string) => {
    return refetchDatatable[key];
  },
  delete: (key: string) => {
    delete refetchDatatable[key];
  },
};

export const triggerDatatableRefetch = (key: string) => {
  const refetchFn = datatableRefetchRegistry.get(key);
  if (refetchFn) {
    refetchFn();
  }
};
