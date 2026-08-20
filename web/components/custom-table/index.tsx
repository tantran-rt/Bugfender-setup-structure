import React from "react";
import "./CustomTable.css";

interface Record {
  [key: string]: string | number | React.ReactNode;
}

interface CustomTableProps {
  records: Record[];
}

const CustomTable: React.FC<CustomTableProps> = ({ records }) => {
  if (records.length === 0) {
    return <div>No data available</div>;
  }

  // Get column headers from the keys of the first record
  const headers = Object.keys(records[0]);

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{formatHeader(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index} className={index % 2 === 1 ? "highlight" : ""}>
              {headers.map((header) => (
                <td key={header}>{renderCellContent(record[header])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to format header text (e.g., "loginStatus" to "Login Status")
const formatHeader = (header: string) => {
  return header
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

// Helper function to render cell content, e.g., handling status badges
const renderCellContent = (content: string | number | React.ReactNode) => {
  if (typeof content === "string") {
    if (content.toLowerCase() === "successful") {
      return <span className="status-badge successful">Successful</span>;
    } else if (content.toLowerCase() === "failed") {
      return <span className="status-badge failed">Failed</span>;
    }
  }
  return content;
};

export default CustomTable;
