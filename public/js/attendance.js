// Attendance API interactions
let employeeData = {};
let attendanceRecords = [];
let currentUser = null;

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Parse URL parameters
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  const employeeId = params.get('employeeId');
  const employeeName = params.get('employeeName');
  const salaryPerDay = params.get('salaryPerDay');

  if (!employeeId || !employeeName) {
    alert('Missing required employee information. Redirecting to dashboard.');
    window.location.href = '/dashboard';
    return {};
  }

  return {
    employeeId,
    employeeName: decodeURIComponent(employeeName),
    salaryPerDay: parseFloat(salaryPerDay) || 500
  };
}

// Initialize the page
async function initPage() {
  try {
    // Get employee details from URL
    const { employeeId, employeeName, salaryPerDay } = getURLParams();
    
    if (!employeeId || !employeeName) {
      return; // getURLParams will handle the redirect
    }
    
    employeeData = {
      employeeId,
      employeeName,
      salaryPerDay
    };
    
    // Update header with employee name
    const headerLogo = document.querySelector('.header-logo');
    if (headerLogo) {
      headerLogo.textContent = `Attendance for ${employeeName}`;
    }
    
    // Set daily amount
    const dailyAmountInput = document.getElementById('dailyAmount');
    if (dailyAmountInput) {
      dailyAmountInput.value = salaryPerDay;
    }
    
    // Get current user info
    await getCurrentUser();
    
    // Load attendance history
    await loadAttendanceRecords();
    
    // Initialize date controls
    populateYearDropdown();
    updateMonthDisplay();
    populateDateDropdown();
    generateTable();
  } catch (error) {
    console.error('Error initializing page:', error);
    alert('Failed to initialize page. Please try again.');
    window.location.href = '/dashboard';
  }
}

// Get current user info
async function getCurrentUser() {
  try {
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user information');
    }
    
    const data = await response.json();
    currentUser = data.user;
    
    // Update phone number in header
    if (currentUser && currentUser.phone) {
      document.querySelector('.header-contact span:last-child').textContent = currentUser.phone;
    }
    
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
}

// Load attendance records for the employee
async function loadAttendanceRecords() {
  try {
    const response = await fetch(`/api/attendance/employee/${employeeData.employeeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load attendance records');
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.attendance)) {
      attendanceRecords = data.attendance;
      
      // Format dates and populate in tableData
      for (const record of attendanceRecords) {
        const date = new Date(record.date);
        const dateStr = formatDate(date);
        
        // Convert API data to table format
        let workTime = "0";
        if (record.status === "present") {
          workTime = "FULL";
        } else if (record.status === "half-day") {
          workTime = "HALF";
        }
        
        tableData[dateStr] = {
          attendance: record.status === "absent" ? "NO" : "YES",
          workTime: workTime,
          amountTaken: record.amountTaken || 0
        };
      }
      
      // Generate table with loaded data
      generateTable();
      
      // Update totals
      updateTotals();
    }
    
  } catch (error) {
    console.error('Error loading attendance records:', error);
  }
}

// Save attendance record to the backend
async function saveAttendance(dateStr, attendanceStatus, workTimeValue, amountTaken) {
  try {
    // Convert from UI format to API format
    let apiStatus = "present";
    if (attendanceStatus === "NO") {
      apiStatus = "absent";
    } else if (workTimeValue === "HALF") {
      apiStatus = "half-day";
    }
    
    const dateObj = parseDateString(dateStr);
    
    const response = await fetch('/api/attendance/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: employeeData.employeeId,
        employeeName: employeeData.employeeName,
        salaryPerDay: employeeData.salaryPerDay,
        status: apiStatus,
        date: dateObj.toISOString(),
        amountTaken: parseInt(amountTaken) || 0
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save attendance');
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Attendance saved successfully');
      // Return success to update UI
      return true;
    } else {
      throw new Error(data.message || 'Failed to save attendance');
    }
    
  } catch (error) {
    console.error('Error saving attendance:', error);
    alert(`Failed to save attendance: ${error.message}`);
    return false;
  }
}

// Parse date string (DD-MM-YY) to Date object
function parseDateString(dateStr) {
  const [day, month, year] = dateStr.split('-');
  // Note: month is 0-indexed in JavaScript Date
  return new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
}

// Override update row function from the HTML to save to backend
async function updateRow(dateStr, element) {
  const row = element.closest('tr');
  if (!row) return;

  const attendance = row.querySelector(".attendance").value;
  const workTime = row.querySelector(".worktime").value;
  const amountTaken = parseInt(row.querySelector(".amount-taken").value) || 0;

  // Check if this is a meaningful update (not just loading default values)
  const rowData = tableData[dateStr] || { attendance: "NO", workTime: "0", amountTaken: 0 };
  if (
    rowData.attendance !== attendance ||
    rowData.workTime !== workTime ||
    rowData.amountTaken !== amountTaken
  ) {
    hasEntryBeenMade = true;
    document.getElementById("dailyAmount").disabled = true;
    
    // Save to backend
    const saved = await saveAttendance(dateStr, attendance, workTime, amountTaken);
    
    if (saved) {
      // Update local data
      tableData[dateStr] = { attendance, workTime, amountTaken };
      localStorage.setItem("tableData", JSON.stringify(tableData));
      
      // Update UI
      updateWorkTimeDropdown(row);
      applyStyles(row);
      updateTotals();
      updateControlForm(dateStr);
    }
  } else {
    // No meaningful change, just update UI
    updateWorkTimeDropdown(row);
    applyStyles(row);
  }
}

// Add these functions to enhance mobile experience
function checkMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialize mobile-specific features
function initMobileFeatures() {
  if (!checkMobileDevice()) return;
  
  // Add mobile class to body for additional CSS targeting
  document.body.classList.add('mobile-device');
  
  // Make table cells more compact on mobile
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      table td, table th {
        padding: 8px 6px;
        font-size: 14px;
      }
      
      .amount-taken {
        width: 70px !important;
      }
      
      select.attendance, select.worktime {
        padding: 8px 2px !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add tap feedback to buttons
  document.querySelectorAll('.btn, .nav-button').forEach(button => {
    button.addEventListener('touchstart', function() {
      this.style.opacity = '0.7';
    });
    
    button.addEventListener('touchend', function() {
      this.style.opacity = '1';
    });
  });
}

// Call this after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initPage();
  initMobileFeatures();
  
  // Add quick refresh button for mobile
  if (checkMobileDevice()) {
    const refreshButton = document.createElement('button');
    refreshButton.className = 'footer-button refresh-button';
    refreshButton.style.marginRight = '10px';
    refreshButton.innerHTML = '↻ Refresh';
    refreshButton.addEventListener('click', function() {
      loadAttendanceRecords();
      
      // Show loading indicator
      this.innerHTML = '⟳ Loading...';
      setTimeout(() => {
        this.innerHTML = '↻ Refresh';
      }, 1000);
    });
    
    const footerDiv = document.querySelector('.footer');
    footerDiv.prepend(refreshButton);
  }
  
  // Override the generatePDF function with mobile optimizations
  window.generatePDF = async function() {
    try {
      // On mobile, show a loading indicator
      if (checkMobileDevice()) {
        const pdfButton = document.querySelector('.footer-button:not(.refresh-button)');
        pdfButton.innerHTML = 'Generating PDF...';
        pdfButton.disabled = true;
      }
      
      // Get latest data from backend before generating PDF
      await loadAttendanceRecords();
      
      // Original PDF generation code follows
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const controlMonth = document.getElementById("controlMonth");
      const controlYear = document.getElementById("controlYear");
      const dailyAmount = document.getElementById("dailyAmount").value;

      // Add company logo and header
      doc.setFontSize(18);
      doc.setTextColor(0, 123, 255);
      doc.text("Elite Workx Fabrication A to Z", 105, 15, {
        align: "center",
      });

      // Add report title and daily amount
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Attendance Report for ${
          controlMonth.options[controlMonth.selectedIndex].text
        } ${controlYear.value}`,
        105,
        25,
        { align: "center" }
      );
      doc.text(`Daily Amount: ₹${dailyAmount}`, 105, 35, {
        align: "center",
      });

      // Add employee name
      doc.text(`Employee: ${employeeData.employeeName}`, 105, 40, {
        align: "center",
      });

      // Prepare table data
      const headers = ["Date", "Attendance", "Work/Time", "Amount Taken"];
      const rows = [];
      let totalPresent = 0,
        totalAbsent = 0,
        totalEarning = 0,
        totalAmountTaken = 0;

      // Collect data from table
      document.querySelectorAll("#tableBody tr").forEach((row) => {
        const date = row.cells[0].textContent;
        const attendance = row.querySelector(".attendance").value;
        const workTime = row.querySelector(".worktime").value;
        const amountTaken =
          parseInt(row.querySelector(".amount-taken").value) || 0;

        rows.push([date, attendance, workTime, `₹${amountTaken}`]);

        if (attendance === "YES") {
          totalPresent++;
          totalEarning +=
            workTime === "FULL"
              ? parseInt(dailyAmount)
              : workTime === "HALF"
              ? parseInt(dailyAmount) / 2
              : 0;
        } else {
          totalAbsent++;
        }
        totalAmountTaken += amountTaken;
      });

      // Add table to PDF using autoTable
      doc.autoTable({
        startY: 45,
        head: [headers],
        body: rows,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [0, 123, 255],
          textColor: [255, 255, 255],
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
        },
        margin: { left: 14, right: 14 },
      });

      // Add totals section
      let finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const summaryData = [
        `Total Present: ${totalPresent} days`,
        `Total Absent: ${totalAbsent} days`,
        `Total Earnings: ₹${totalEarning}`,
        `Total Amount Taken: ₹${totalAmountTaken}`,
        `Remaining Amount: ₹${Math.max(
          0,
          totalEarning - totalAmountTaken
        )}`,
      ];

      summaryData.forEach((text, index) => {
        doc.text(text, 14, finalY + index * 8);
      });

      // Add footer with date
      const currentDate = new Date();
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Generated on: ${formatDate(currentDate)}`,
        14,
        doc.internal.pageSize.height - 10
      );

      // Save the PDF
      const fileName = `Attendance_${employeeData.employeeName}_${
        controlMonth.options[controlMonth.selectedIndex].text
      }_${controlYear.value}.pdf`;
      doc.save(fileName);
      
      // Reset button on mobile
      if (checkMobileDevice()) {
        const pdfButton = document.querySelector('.footer-button:not(.refresh-button)');
        pdfButton.innerHTML = 'Generate PDF';
        pdfButton.disabled = false;
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF: " + error.message);
      
      // Reset button on mobile
      if (checkMobileDevice()) {
        const pdfButton = document.querySelector('.footer-button:not(.refresh-button)');
        pdfButton.innerHTML = 'Generate PDF';
        pdfButton.disabled = false;
      }
    }
  };
}); 