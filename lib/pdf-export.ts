import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Mock implementations removed - real packages now installed

export interface ReportData {
  title: string
  track: string
  date: string
  drivers: string[]
  sections: ReportSection[]
}

export interface ReportSection {
  title: string
  type: 'text' | 'chart' | 'table' | 'stats'
  content: any
  metadata?: {
    chartImage?: string
    tableData?: any[]
    stats?: Record<string, any>
  }
}

class F1ReportExporter {
  private pdf: jsPDF
  private pageHeight: number
  private currentY: number
  private margin: number

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageHeight = this.pdf.internal.pageSize.height
    this.currentY = 20
    this.margin = 20
  }

  async generateReport(data: ReportData): Promise<Blob> {
    // Add title page
    this.addTitlePage(data)
    
    // Add sections
    for (const section of data.sections) {
      await this.addSection(section)
    }
    
    // Add footer
    this.addFooter()
    
    return new Blob([this.pdf.output('blob')], { type: 'application/pdf' })
  }

  private addTitlePage(data: ReportData) {
    // Title
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(data.title, this.margin, this.currentY)
    
    // Subtitle
    this.currentY += 15
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(`Track Analysis Report`, this.margin, this.currentY)
    
    // Track info
    this.currentY += 10
    this.pdf.setFontSize(12)
    this.pdf.text(`Track: ${data.track}`, this.margin, this.currentY)
    
    this.currentY += 7
    this.pdf.text(`Date: ${data.date}`, this.margin, this.currentY)
    
    this.currentY += 7
    this.pdf.text(`Drivers: ${data.drivers.join(', ')}`, this.margin, this.currentY)
    
    // Add line separator
    this.currentY += 15
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY)
    
    this.currentY += 10
  }

  private async addSection(section: ReportSection) {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 50) {
      this.addNewPage()
    }
    
    // Section title
    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(section.title, this.margin, this.currentY)
    this.currentY += 10
    
    switch (section.type) {
      case 'text':
        this.addTextSection(section)
        break
      case 'chart':
        await this.addChartSection(section)
        break
      case 'table':
        this.addTableSection(section)
        break
      case 'stats':
        this.addStatsSection(section)
        break
    }
    
    this.currentY += 15
  }

  private addTextSection(section: ReportSection) {
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    
    const lines = this.pdf.splitTextToSize(section.content, this.pdf.internal.pageSize.width - (this.margin * 2))
    lines.forEach((line: string) => {
      if (this.currentY > this.pageHeight - 20) {
        this.addNewPage()
      }
      this.pdf.text(line, this.margin, this.currentY)
      this.currentY += 5
    })
  }

  private async addChartSection(section: ReportSection) {
    if (section.metadata?.chartImage) {
      try {
        // Add chart image
        const imgData = section.metadata.chartImage
        const imgWidth = this.pdf.internal.pageSize.width - (this.margin * 2)
        const imgHeight = 100
        
        if (this.currentY + imgHeight > this.pageHeight - 20) {
          this.addNewPage()
        }
        
        this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight)
        this.currentY += imgHeight + 10
      } catch (error) {
        console.error('Error adding chart to PDF:', error)
        // Fallback to text
        this.addTextSection({ ...section, content: '[Chart data unavailable for export]' })
      }
    } else {
      // Fallback to chart description
      this.addTextSection({ ...section, content: section.content || 'Chart section' })
    }
  }

  private addTableSection(section: ReportSection) {
    if (!section.metadata?.tableData) return
    
    const tableData = section.metadata.tableData
    const headers = Object.keys(tableData[0] || {})
    const cellWidth = (this.pdf.internal.pageSize.width - (this.margin * 2)) / headers.length
    
    // Add table headers
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'bold')
    headers.forEach((header, index) => {
      const x = this.margin + (index * cellWidth)
      this.pdf.text(header, x, this.currentY)
    })
    
    this.currentY += 7
    
    // Add table rows
    this.pdf.setFont('helvetica', 'normal')
    tableData.forEach((row: any, rowIndex: number) => {
      if (this.currentY > this.pageHeight - 20) {
        this.addNewPage()
      }
      
      headers.forEach((header, colIndex) => {
        const x = this.margin + (colIndex * cellWidth)
        const cellText = String(row[header] || '').substring(0, 15) // Truncate long text
        this.pdf.text(cellText, x, this.currentY)
      })
      
      this.currentY += 5
    })
  }

  private addStatsSection(section: ReportSection) {
    if (!section.metadata?.stats) return
    
    const stats = section.metadata.stats
    const statsEntries = Object.entries(stats)
    
    this.pdf.setFontSize(10)
    statsEntries.forEach(([key, value]) => {
      if (this.currentY > this.pageHeight - 20) {
        this.addNewPage()
      }
      
      const label = `${key}:`
      const valueText = String(value)
      
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(label, this.margin, this.currentY)
      
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(valueText, this.margin + 40, this.currentY)
      
      this.currentY += 6
    })
  }

  private addNewPage() {
    this.pdf.addPage()
    this.currentY = 20
  }

  private addFooter() {
    const footerY = this.pageHeight - 10
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'italic')
    this.pdf.text(
      `Generated by KobayashiAI F1 Analytics - ${new Date().toLocaleString()}`,
      this.margin,
      footerY
    )
  }
}

// Utility function to capture chart as image
export async function captureChartAsImage(chartElement: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#1a1a1a',
      scale: 2,
      logging: false
    })
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error capturing chart:', error)
    return ''
  }
}

// Main export function
export async function exportF1Report(
  title: string,
  track: string,
  drivers: string[],
  sections: ReportSection[]
): Promise<void> {
  const exporter = new F1ReportExporter()
  
  const reportData: ReportData = {
    title,
    track,
    date: new Date().toLocaleDateString(),
    drivers,
    sections
  }
  
  try {
    const pdfBlob = await exporter.generateReport(reportData)
    
    // Download the PDF
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.replace(/\s+/g, '_')}_${track.replace(/\s+/g, '_')}_${Date.now()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating PDF report:', error)
    throw new Error('Failed to generate PDF report')
  }
}

// Quick export functions for common report types
export async function exportRaceAnalysisReport(
  track: string,
  chartElements: HTMLElement[],
  tableData: any[],
  stats: Record<string, any>
) {
  const sections: ReportSection[] = [
    {
      title: 'Executive Summary',
      type: 'text',
      content: `This report provides a comprehensive analysis of the race simulation at ${track}. The analysis includes lap time evolution, tire degradation patterns, and performance metrics for strategic decision-making.`
    },
    {
      title: 'Lap Time Analysis',
      type: 'chart',
      content: 'Lap time evolution throughout the race simulation',
      metadata: {
        chartImage: chartElements[0] ? await captureChartAsImage(chartElements[0]) : ''
      }
    },
    {
      title: 'Tire Strategy',
      type: 'chart',
      content: 'Tire degradation analysis and optimal strategy recommendations',
      metadata: {
        chartImage: chartElements[1] ? await captureChartAsImage(chartElements[1]) : ''
      }
    },
    {
      title: 'Performance Metrics',
      type: 'stats',
      content: 'Key performance indicators and statistics',
      metadata: { stats }
    },
    {
      title: 'Detailed Results',
      type: 'table',
      content: 'Complete race simulation results',
      metadata: { tableData }
    }
  ]
  
  await exportF1Report('F1 Race Analysis Report', track, ['Simulation Drivers'], sections)
}

export async function exportWhatIfReport(
  track: string,
  scenarios: any[],
  recommendations: string[]
) {
  const sections: ReportSection[] = [
    {
      title: 'Scenario Analysis',
      type: 'text',
      content: `Analysis of ${scenarios.length} different race scenarios at ${track}. Each scenario was evaluated based on lap time impact, position gain potential, and risk assessment.`
    },
    {
      title: 'Scenario Comparison',
      type: 'table',
      content: 'Comparison of different what-if scenarios',
      metadata: { tableData: scenarios }
    },
    {
      title: 'Strategic Recommendations',
      type: 'text',
      content: recommendations.join('\n\n')
    }
  ]
  
  await exportF1Report('F1 What-If Analysis Report', track, ['Analysis Team'], sections)
}
