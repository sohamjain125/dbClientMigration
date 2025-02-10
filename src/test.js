import React, { useState ,useMemo} from 'react';
import './App.css';

const Summary = ({ results }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Move useMemo hooks before the early return
    const filteredData = useMemo(() => {
        if (!results?.details) return [];
        return results.details.filter(detail => 
            Object.values(detail.record).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            ) || detail.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [results?.details, searchTerm]);

    const columns = useMemo(() => {
        if (!results?.details?.[0]?.record) return [];
        const firstRecord = results.details[0].record;
        return Object.keys(firstRecord).map(key => ({
            id: key,
            // Convert camelCase to Title Case automatically
            label: key.replace(/([A-Z])/g, ' $1')
                   .replace(/^./, str => str.toUpperCase())
                   .trim(),
            value: (record) => record[key]
        }));
    }, [results?.details]);

    // Early return if no results
    if (!results || !results.details || !results.details.length) return null;

   

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div className="migration-results">
            <h2>Migration Results</h2>
            
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <i className="fas fa-database"></i>
                    <div className="stat-content">
                        <h3>Total Records</h3>
                        <p>{results.total}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <i className="fas fa-check-circle"></i>
                    <div className="stat-content">
                        <h3>Successfully Processed</h3>
                        <p>{results.processed}</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div className="stat-content">
                        <h3>Skipped</h3>
                        <p>{results.skipped}</p>
                    </div>
                </div>
                <div className="stat-card error">
                    <i className="fas fa-times-circle"></i>
                    <div className="stat-content">
                        <h3>Failed</h3>
                        <p>{results.failed}</p>
                    </div>
                </div>
            </div>

            {/* Search and Pagination Controls */}
            <div className="table-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                </div>
                
                <div className="rows-per-page">
                    <label>Rows per page:</label>
                    <select 
                        value={rowsPerPage} 
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Detailed Results Table */}
            <div className="details-section">
                <h3>Detailed Results</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Status</th>
                                {columns.map(column => (
                                    <th key={column.id}>{column.label}</th>
                                ))}
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((detail, index) => (
                                <tr key={startIndex + index} className={`status-${detail.status}`}>
                                    <td>
                                        <span className={`status-badge ${detail.status}`}>
                                            {detail.status === 'success' && <i className="fas fa-check"></i>}
                                            {detail.status === 'skipped' && <i className="fas fa-exclamation-triangle"></i>}
                                            {detail.status === 'failed' && <i className="fas fa-times"></i>}
                                            {detail.status}
                                        </span>
                                    </td>
                                    {columns.map(column => (
                                        <td key={column.id}>{column.value(detail.record)}</td>
                                    ))}
                                    <td>{detail.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="pagination-controls">
                    <button 
                        onClick={() => setCurrentPage(1)} 
                        disabled={currentPage === 1}
                    >
                        <i className="fas fa-angle-double-left"></i>
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => prev - 1)} 
                        disabled={currentPage === 1}
                    >
                        <i className="fas fa-angle-left"></i>
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                        {searchTerm && ` (Filtered: ${filteredData.length} records)`}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(prev => prev + 1)} 
                        disabled={currentPage === totalPages}
                    >
                        <i className="fas fa-angle-right"></i>
                    </button>
                    <button 
                        onClick={() => setCurrentPage(totalPages)} 
                        disabled={currentPage === totalPages}
                    >
                        <i className="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Summary;
