"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/ui-css/button";
import { ScrollArea } from "@/ui-css/scroll-area";
import { History, Tag, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { authToken } from "@/redux/slices/auth";
import { getDonorQueries, resolveDonorQuery, type Ticket } from "@/lib/api";

interface QueryHistoryComponentProps {
  onNewQuery: () => void;
  onSelectQuery: (query: Ticket) => void;
}

export default function QueryHistoryComponent({
  onNewQuery,
  onSelectQuery,
}: QueryHistoryComponentProps) {
  const [queries, setQueries] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvingQueries, setResolvingQueries] = useState<
    Record<string, boolean>
  >({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get auth data from Redux store
  const auth = useSelector(authToken);

  // Determine if there are any unresolved queries
  const hasUnresolvedQueries = queries.some(
    (query) => query.status !== "resolved"
  );

  // Get donor ID from auth
  const getDonorId = useCallback(() => {
    return auth?.participant_id ? auth.participant_id.toString() : "anonymous";
  }, [auth]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Today";
      }
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Today";
    }
  };

  // Toggle the dropdown menu
  const toggleMenu = (queryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveMenu(activeMenu === queryId ? null : queryId);
  };

  // Function to handle resolving a query
  const handleResolveQuery = async (
    queryId: string,
    event: React.MouseEvent
  ) => {
    // Prevent the click from propagating to the parent div (which would select the query)
    event.stopPropagation();

    // Close the menu
    setActiveMenu(null);

    // Set the resolving state for this query
    setResolvingQueries((prev) => ({ ...prev, [queryId]: true }));

    try {
      // Call the API to resolve the query with donorId
      await resolveDonorQuery(queryId, getDonorId());

      // Refresh the queries list to get the updated state
      const donorId = getDonorId();
      const updatedQueries = await getDonorQueries(donorId);
      setQueries(updatedQueries);

      toast.success("Query marked as resolved");
    } catch (error) {
      console.error("Error resolving query:", error);
      toast.error("Failed to resolve query");
    } finally {
      // Clear the resolving state
      setResolvingQueries((prev) => ({ ...prev, [queryId]: false }));
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu) {
        const menuRef = menuRefs.current[activeMenu];
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setActiveMenu(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  // Fetch queries when component mounts
  useEffect(() => {
    const fetchQueries = async () => {
      setIsLoading(true);
      try {
        const donorId = getDonorId();
        const fetchedQueries = await getDonorQueries(donorId);
        setQueries(fetchedQueries);
      } catch (error) {
        console.error("Error fetching queries:", error);
        toast.error("Failed to fetch queries");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueries();
  }, [getDonorId]);

  return (
    <div className="support-panel__history">
      <div className="support-panel__new-query">
        <Button
          className="support-panel__new-query-button"
          onClick={onNewQuery}
          disabled={hasUnresolvedQueries}
          title={
            hasUnresolvedQueries
              ? "Resolve pending queries before creating a new one"
              : ""
          }
        >
          New Support Request
        </Button>
      </div>
      <ScrollArea className="support-panel__queries">
        {isLoading ? (
          <div className="support-panel__loading">
            <div className="support-panel__loading-spinner"></div>
          </div>
        ) : queries.length === 0 ? (
          <div className="support-panel__empty">
            <History className="support-panel__empty-icon" />
            <p>No previous queries</p>
          </div>
        ) : (
          <div className="support-panel__query-list">
            {queries.map((query) => (
              <div key={query.id} className="support-panel__query-item">
                <div
                  className="support-panel__query-content-wrapper"
                  onClick={() => onSelectQuery(query)}
                >
                  <div className="support-panel__query-header">
                    <span className="support-panel__query-id">
                      Query {query.id}
                    </span>
                    <div className="support-panel__query-header-actions">
                      <span
                        className={`support-panel__query-status ${
                          query.status === "resolved"
                            ? "support-panel__query-status--resolved"
                            : "support-panel__query-status--pending"
                        }`}
                      >
                        {query.status === "resolved" ? "Resolved" : "Pending"}
                      </span>

                      {query.status !== "resolved" && (
                        <div
                          className="support-panel__query-menu-container"
                          ref={(el: HTMLDivElement | null): void => {
                            menuRefs.current[query.id] = el;
                          }}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="support-panel__query-menu-button"
                            onClick={(e) => toggleMenu(query.id, e)}
                            aria-label="Query options"
                          >
                            <MoreVertical className="support-panel__query-menu-icon" />
                          </Button>

                          {activeMenu === query.id && (
                            <div className="support-panel__query-dropdown">
                              <button
                                className="support-panel__query-dropdown-item"
                                onClick={(e) => handleResolveQuery(query.id, e)}
                                disabled={resolvingQueries[query.id]}
                              >
                                {resolvingQueries[query.id] ? (
                                  <>
                                    <span className="support-panel__query-resolve-spinner"></span>
                                    <span>Resolving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Tag className="support-panel__query-dropdown-icon" />
                                    <span>Mark as Resolved</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="support-panel__query-content">
                    {query.description || "No description available"}
                  </p>
                  <span className="support-panel__query-date">
                    {formatDate(query.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
