import { SortMeta } from 'primeng/api';

export interface GridState {
    visibleColumns: string[];
    columnOrder: string[];
    columnWidths: Record<string, string>;
    sortState: SortMeta[];
}
