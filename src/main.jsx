///////////////////////////////////////////////////////////////////////////////
// SETUP: DEPENDENCIES AND CONSTANTS
///////////////////////////////////////////////////////////////////////////////
import React, { useState, useCallback, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  flatten,
  uniq,
  capitalize,
  isString,
  sortBy,
  reverse,
  isNumber,
} from "lodash"; // lodash
import "./main.css";

// Constants
const STATE_DATA_URL = "https://assets.codepen.io/5781725/states-data.json";

const ASC = "ascending";
const DEC = "descending";

///////////////////////////////////////////////////////////////////////////////
// DATA GRID COMPONENTS
///////////////////////////////////////////////////////////////////////////////
// A single cell in a data grid
const Cell = ({ datum, pinned }) => {
  return (
    <td className={pinned ? "pinned" : ""}>
      {isString(datum) && datum.toLowerCase().endsWith(".png") ? (
        <img src={datum} />
      ) : isNumber(datum) ? (
        datum.toLocaleString()
      ) : (
        datum
      )}
    </td>
  );
};

// A cell in a header row in a data grid
const HeaderCell = ({ title, onClick, pinned }) => {
  return (
    <th onClick={onClick} className={pinned ? "pinned" : ""}>
      {capitalize(title)}
    </th>
  );
};

// Custom hook to abstract logic from component
const useStateData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortedOn, setSortedOn] = useState({ direction: ASC, column: "state" });
  const [pinnedColumns, setPinnedColumns] = useState([]);

  const getStatesData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(STATE_DATA_URL);
      const statesData = await res.json();
      setLoading(false);
      setData(statesData);
    } catch (err) {
      setLoading(false);
      setError("Error fetching states");
      console.error("Error fetching states", err.message);
    }
  }, [setData, setLoading, setError]);

  const handlePinning = useCallback(
    (col) => {
      if (pinnedColumns.includes(col)) {
        setPinnedColumns((currentPinned) =>
          currentPinned.filter((c) => c !== col)
        );
      } else {
        // pinned first -> stays first
        setPinnedColumns((currentPinned) => [...currentPinned, col]);
      }
    },
    [pinnedColumns, setPinnedColumns]
  );

  const handleSort = useCallback(
    (col) => {
      if (sortedOn.column === col) {
        // currenly sorted by this column
        if (sortedOn.direction === ASC) {
          // currently in ascending order
          setSortedOn({ ...sortedOn, direction: DEC });
          setData(reverse(sortBy(data, [col])));
        } else {
          // currently in descending order
          setSortedOn({ direction: ASC, column: "state" });
          setData(sortBy(data, ["state"]));
        }
      } else {
        // first click on column
        setSortedOn({ direction: ASC, column: col });
        setData(sortBy(data, [col]));
      }
    },
    [sortedOn, setSortedOn, data, setData]
  );

  const initialColumns = useMemo(() => {
    return uniq(
      flatten(
        data.map((row) =>
          Object.keys(row).filter((key) => !key.startsWith("_"))
        )
      )
    );
  }, [data]);

  // uniq keeps first occurrence
  const newColumns = useMemo(() => {
    return uniq([...pinnedColumns, ...initialColumns]);
  }, [pinnedColumns, initialColumns]);

  useEffect(() => {
    getStatesData();
  }, [getStatesData]);

  return {
    data,
    handlePinning,
    handleSort,
    columns: newColumns,
    pinnedColumns,
    loading,
    error,
  };
};

///////////////////////////////////////////////////////////////////////////////
// DATAGRID COMPONENT WITH INSTANTIATION
///////////////////////////////////////////////////////////////////////////////
const DataGrid = () => {
  const {
    data,
    handlePinning,
    handleSort,
    columns,
    pinnedColumns,
    loading,
    error,
  } = useStateData();

  // Event handlers
  const onClick = (col) => (event) =>
    event?.metaKey ? handlePinning(col) : handleSort(col);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Render
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <HeaderCell
              key={i}
              title={col}
              onClick={onClick(col)}
              pinned={pinnedColumns.includes(col)}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col, j) => (
              <Cell
                key={j}
                datum={row[col]}
                pinned={pinnedColumns.includes(col)}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Instantiate
ReactDOM.render(
  <React.StrictMode>
    <DataGrid />
  </React.StrictMode>,
  document.getElementById("root")
);
