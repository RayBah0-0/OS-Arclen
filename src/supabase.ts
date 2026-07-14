import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Replicate chainable Supabase query builder using localStorage
class MockQueryBuilder {
  table: string;
  filters: { field: string; value: any; operator: string }[] = [];
  sortField: string = '';
  sortAscending: boolean = true;
  isSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value, operator: 'eq' });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, value: values, operator: 'in' });
    return this;
  }

  order(field: string, options: any = {}) {
    this.sortField = field;
    this.sortAscending = options.ascending !== false;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  private _getData(): any[] {
    const key = `mock_supabase_${this.table}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Seed initial mock data so the app isn't blank
      if (this.table === 'profiles') {
        return [
          { username: 'Rayane', mrr: 1500, calls: 5 },
          { username: 'Alex', mrr: 2200, calls: 12 }
        ];
      }
      if (this.table === 'leads') {
        return [
          { id: '1', username: 'Rayane', name: 'Acme Corp', value: 1200, status: 'open', source: 'Cold Email', email: 'acme@example.com', phone: '', notes: '', created_at: new Date().toISOString() },
          { id: '2', username: 'Rayane', name: 'Stark Industries', value: 3000, status: 'closed', source: 'LinkedIn', email: 'stark@example.com', phone: '', notes: '', created_at: new Date().toISOString() }
        ];
      }
      if (this.table === 'blockers') {
        return [
          { id: '1', username: 'Rayane', title: 'Supabase Paused', description: 'Running app in Offline Local Mode', color: 'var(--status-warning)', created_at: new Date().toISOString() }
        ];
      }
      return [];
    }
    return JSON.parse(raw);
  }

  private _setData(data: any[]) {
    const key = `mock_supabase_${this.table}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  async then(onfulfilled: any) {
    const res = await this.execute();
    return onfulfilled(res);
  }

  async execute() {
    let data = this._getData();

    // Filter
    for (const filter of this.filters) {
      if (filter.operator === 'eq') {
        data = data.filter(item => item[filter.field] === filter.value);
      } else if (filter.operator === 'in') {
        const valArray = Array.isArray(filter.value) ? filter.value : [filter.value];
        data = data.filter(item => valArray.includes(item[filter.field]));
      }
    }

    // Sort
    if (this.sortField) {
      data.sort((a, b) => {
        const valA = a[this.sortField];
        const valB = b[this.sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return this.sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this.sortAscending ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
    }

    if (this.isSingle) {
      return { data: data[0] || null, error: null };
    }

    return { data, error: null };
  }

  async insert(rows: any[]) {
    const data = this._getData();
    const newRows = rows.map(r => ({
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      ...r
    }));
    data.push(...newRows);
    this._setData(data);
    return { data: newRows, error: null };
  }

  async update(updates: any) {
    const data = this._getData();
    const nextData = data.map(item => {
      let match = true;
      for (const filter of this.filters) {
        if (filter.operator === 'eq' && item[filter.field] !== filter.value) {
          match = false;
        }
      }
      if (match) {
        return { ...item, ...updates };
      }
      return item;
    });
    this._setData(nextData);
    return { data: nextData, error: null };
  }

  async delete() {
    const data = this._getData();
    const nextData = data.filter(item => {
      let match = true;
      for (const filter of this.filters) {
        if (filter.operator === 'eq' && item[filter.field] !== filter.value) {
          match = false;
        }
      }
      return !match;
    });
    this._setData(nextData);
    return { data: null, error: null };
  }
}

class MockSupabaseClient {
  from(table: string) {
    return new MockQueryBuilder(table);
  }
  channel() {
    return {
      on: () => ({
        on: () => ({
          subscribe: () => ({})
        }),
        subscribe: () => ({})
      }),
      subscribe: () => ({})
    };
  }
  removeChannel() {}
}

const isDefaultUnresolvedHost = !supabaseUrl || supabaseUrl.includes("qpcgwfrudbnbysyzwqja.supabase.co");

let clientInstance: any;
if (isDefaultUnresolvedHost) {
  console.log("Supabase URL is unresolved/paused. Using Mock Local Storage Client instead.");
  clientInstance = new MockSupabaseClient();
} else {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey || "");
  } catch (e) {
    console.error("Failed to initialize Supabase client. Falling back to Mock Local Storage Client.", e);
    clientInstance = new MockSupabaseClient();
  }
}

export const supabase = clientInstance;
