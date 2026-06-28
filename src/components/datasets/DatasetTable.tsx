import type { CustomRange, Dataset, Measurement, Timeline } from "../../types/dataset";
import { DatasetTableFilters } from "./DatasetTableFilters";
import { DatasetTableMain } from "./DatasetTableMain";
import { DatasetTableSelectionPanel } from "./DatasetTableSelectionPanel";
import { useDatasetTableFilters } from "./useDatasetTableFilters";

export interface DatasetTableProps {
  dataset: Dataset;
  measurements: Measurement[];
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  syncWithGraph: boolean;
  onSyncWithGraphChange: (sync: boolean) => void;
  onFilteredMeasurementsChange: (filtered: Measurement[]) => void;
  timeline: Timeline;
  onTimelineChange: (timeline: Timeline) => void;
  customRange: CustomRange;
  onCustomRangeChange: (customRange: CustomRange) => void;
}

export function DatasetTable(props: DatasetTableProps) {
  const { state, actions } = useDatasetTableFilters(props);

  return (
    <div className="w-full flex flex-col">
      <DatasetTableFilters dataset={props.dataset} state={state} actions={actions} />

      <DatasetTableSelectionPanel
        selectedCount={state.selectedIds.length}
        onClear={() => actions.setSelectedIds([])}
        onPurge={() => {
          props.onDeleteMultiple(state.selectedIds);
          actions.setSelectedIds([]);
        }}
      />

      <DatasetTableMain
        dataset={props.dataset}
        measurements={state.sortedAndFilteredMeasurements}
        selectedIds={state.selectedIds}
        sortColumn={state.sortColumn}
        sortDirection={state.sortDirection}
        isAllSelected={state.isAllSelected}
        onSort={actions.handleSort}
        onToggleSelect={actions.toggleSelect}
        onToggleSelectAll={actions.toggleSelectAll}
        onDelete={props.onDelete}
      />
    </div>
  );
}
