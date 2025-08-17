import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Product } from "@shared/schema";
import { FilterState } from "@/types";

interface AppState {
  filters: FilterState;
  searchQuery: string;
  isLoading: boolean;
}

type AppAction =
  | { type: "SET_FILTERS"; payload: Partial<FilterState> }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AppState = {
  filters: {
    ageRange: "",
    type: "",
    category: "",
  },
  searchQuery: "",
  isLoading: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  filteredProducts: (products: Product[]) => Product[];
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const filteredProducts = (products: Product[]): Product[] => {
    return products.filter((product) => {
      // Age range filter
      if (state.filters.ageRange && !product.ageRange.includes(state.filters.ageRange)) {
        return false;
      }

      // Type filter
      if (state.filters.type && product.type !== state.filters.type) {
        return false;
      }

      // Category filter
      if (state.filters.category && product.category !== state.filters.category) {
        return false;
      }

      // Search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, filteredProducts }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
