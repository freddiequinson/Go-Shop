/**
 * Export utilities for CSV and Excel
 */

export const exportUtils = {
  /**
   * Convert array of objects to CSV
   */
  toCSV: (data: any[], filename: string = 'export.csv') => {
    if (!data || data.length === 0) {
      console.error('No data to export')
      return
    }

    // Get headers from first object
    const headers = Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  /**
   * Convert table element to CSV
   */
  tableToCSV: (tableId: string, filename: string = 'table-export.csv') => {
    const table = document.getElementById(tableId) as HTMLTableElement
    if (!table) {
      console.error(`Table with id "${tableId}" not found`)
      return
    }

    const rows = Array.from(table.querySelectorAll('tr'))
    const csvContent = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'))
      return cells.map(cell => {
        const text = cell.textContent || ''
        // Handle values with commas or quotes
        if (text.includes(',') || text.includes('"')) {
          return `"${text.replace(/"/g, '""')}"`
        }
        return text
      }).join(',')
    }).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  /**
   * Convert data to JSON and download
   */
  toJSON: (data: any, filename: string = 'export.json') => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  /**
   * Format date for export
   */
  formatDate: (date: Date | string): string => {
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  },

  /**
   * Format currency for export
   */
  formatCurrency: (amount: number, currency: string = 'GH₵'): string => {
    return `${currency}${amount.toFixed(2)}`
  }
}
