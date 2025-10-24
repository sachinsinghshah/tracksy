"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Search, 
  X,
  Calendar,
  DollarSign,
  Tag,
  Activity
} from "lucide-react";

export interface FilterOptions {
  search: string;
  sortBy: "name" | "price" | "created_at" | "last_checked";
  sortOrder: "asc" | "desc";
  status: "all" | "active" | "paused";
  priceRange: "all" | "under-50" | "50-100" | "100-500" | "over-500";
  sites: string[];
  hasTarget: "all" | "yes" | "no";
}

interface ProductFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableSites: string[];
}

export function ProductFilters({ 
  filters, 
  onFiltersChange, 
  availableSites 
}: ProductFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFiltersChange({ ...filters, search: value });
  };

  const handleSortChange = (sortBy: FilterOptions["sortBy"], sortOrder: FilterOptions["sortOrder"]) => {
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const handleStatusChange = (status: FilterOptions["status"]) => {
    onFiltersChange({ ...filters, status });
  };

  const handlePriceRangeChange = (priceRange: FilterOptions["priceRange"]) => {
    onFiltersChange({ ...filters, priceRange });
  };

  const handleSiteToggle = (site: string) => {
    const newSites = filters.sites.includes(site)
      ? filters.sites.filter(s => s !== site)
      : [...filters.sites, site];
    onFiltersChange({ ...filters, sites: newSites });
  };

  const handleTargetToggle = (hasTarget: FilterOptions["hasTarget"]) => {
    onFiltersChange({ ...filters, hasTarget });
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search: "",
      sortBy: "created_at",
      sortOrder: "desc",
      status: "all",
      priceRange: "all",
      sites: [],
      hasTarget: "all",
    };
    setSearchInput("");
    onFiltersChange(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== "all") count++;
    if (filters.priceRange !== "all") count++;
    if (filters.sites.length > 0) count++;
    if (filters.hasTarget !== "all") count++;
    return count;
  };

  const getSortLabel = () => {
    const labels = {
      name: "Name",
      price: "Price",
      created_at: "Date Added",
      last_checked: "Last Checked",
    };
    return labels[filters.sortBy];
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => handleSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {filters.sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              Sort: {getSortLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSortChange("name", "asc")}>
              <Tag className="mr-2 h-4 w-4" />
              Name A-Z
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("name", "desc")}>
              <Tag className="mr-2 h-4 w-4" />
              Name Z-A
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("price", "asc")}>
              <DollarSign className="mr-2 h-4 w-4" />
              Price Low-High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("price", "desc")}>
              <DollarSign className="mr-2 h-4 w-4" />
              Price High-Low
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("created_at", "desc")}>
              <Calendar className="mr-2 h-4 w-4" />
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("created_at", "asc")}>
              <Calendar className="mr-2 h-4 w-4" />
              Oldest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("last_checked", "desc")}>
              <Activity className="mr-2 h-4 w-4" />
              Recently Checked
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              Status
              {filters.status !== "all" && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.status === "all"}
              onCheckedChange={() => handleStatusChange("all")}
            >
              All Products
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.status === "active"}
              onCheckedChange={() => handleStatusChange("active")}
            >
              Active Only
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.status === "paused"}
              onCheckedChange={() => handleStatusChange("paused")}
            >
              Paused Only
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Price Range Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
              {filters.priceRange !== "all" && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by Price</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.priceRange === "all"}
              onCheckedChange={() => handlePriceRangeChange("all")}
            >
              All Prices
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.priceRange === "under-50"}
              onCheckedChange={() => handlePriceRangeChange("under-50")}
            >
              Under $50
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.priceRange === "50-100"}
              onCheckedChange={() => handlePriceRangeChange("50-100")}
            >
              $50 - $100
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.priceRange === "100-500"}
              onCheckedChange={() => handlePriceRangeChange("100-500")}
            >
              $100 - $500
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.priceRange === "over-500"}
              onCheckedChange={() => handlePriceRangeChange("over-500")}
            >
              Over $500
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sites Filter */}
        {availableSites.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Sites
                {filters.sites.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {filters.sites.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Site</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableSites.map((site) => (
                <DropdownMenuCheckboxItem
                  key={site}
                  checked={filters.sites.includes(site)}
                  onCheckedChange={() => handleSiteToggle(site)}
                >
                  {site}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Target Price Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Tag className="h-4 w-4" />
              Target Price
              {filters.hasTarget !== "all" && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by Target Price</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.hasTarget === "all"}
              onCheckedChange={() => handleTargetToggle("all")}
            >
              All Products
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.hasTarget === "yes"}
              onCheckedChange={() => handleTargetToggle("yes")}
            >
              Has Target Price
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.hasTarget === "no"}
              onCheckedChange={() => handleTargetToggle("no")}
            >
              No Target Price
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleSearchChange("")}
              />
            </Badge>
          )}
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleStatusChange("all")}
              />
            </Badge>
          )}
          {filters.priceRange !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Price: {filters.priceRange}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handlePriceRangeChange("all")}
              />
            </Badge>
          )}
          {filters.sites.map((site) => (
            <Badge key={site} variant="secondary" className="gap-1">
              Site: {site}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleSiteToggle(site)}
              />
            </Badge>
          ))}
          {filters.hasTarget !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Target: {filters.hasTarget === "yes" ? "Has target" : "No target"}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleTargetToggle("all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}