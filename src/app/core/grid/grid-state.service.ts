import { Injectable } from '@angular/core';
import { SortMeta } from 'primeng/api';
import { GridState } from './grid-state.model';

@Injectable({ providedIn: 'root' })
export class GridStateService {
    save(pageName: string, gridName: string, state: GridState): void {
        if (typeof localStorage !== 'undefined') {
            try {
                const key = this.storageKey(pageName, gridName);
                localStorage.setItem(key, JSON.stringify(state));
            } catch {}
        }
    }

    load(pageName: string, gridName: string): GridState | null {
        if (typeof localStorage === 'undefined') {
            return null;
        }
        try {
            const key = this.storageKey(pageName, gridName);
            const raw = localStorage.getItem(key);
            if (raw === null) {
                return null;
            }
            const parsed: unknown = JSON.parse(raw);
            return this.parseGridState(parsed);
        } catch {
            return null;
        }
    }

    clear(pageName: string, gridName: string): void {
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.removeItem(this.storageKey(pageName, gridName));
            } catch {}
        }
    }

    private storageKey(pageName: string, gridName: string): string {
        return `grid.${pageName}.${gridName}`;
    }

    private parseGridState(value: unknown): GridState | null {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return null;
        }
        const o = value as Record<string, unknown>;
        const { visibleColumns, columnOrder, columnWidths, sortState } = o;
        if (!this.isStringArray(visibleColumns)) {
            return null;
        }
        if (!this.isStringArray(columnOrder)) {
            return null;
        }
        if (!this.isStringRecord(columnWidths)) {
            return null;
        }
        if (!this.isSortMetaArray(sortState)) {
            return null;
        }
        return {
            visibleColumns,
            columnOrder,
            columnWidths,
            sortState
        };
    }

    private isStringArray(v: unknown): v is string[] {
        return Array.isArray(v) && v.every((x) => typeof x === 'string');
    }

    private isStringRecord(v: unknown): v is Record<string, string> {
        if (typeof v !== 'object' || v === null || Array.isArray(v)) {
            return false;
        }
        return Object.values(v).every((x) => typeof x === 'string');
    }

    private isSortMetaArray(v: unknown): v is SortMeta[] {
        if (!Array.isArray(v)) {
            return false;
        }
        return v.every(
            (item) =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as SortMeta).field === 'string' &&
                typeof (item as SortMeta).order === 'number'
        );
    }
}
