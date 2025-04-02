let employeeData = {};
let attendanceRecords = [];
let currentUser = null;
let tableData = {}; // Single global declaration
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

function getToken() {
  const token = localStorage.getItem('token');
  console.log("Retrieved token:", token ? "Token exists" : "No token found");
  return token;
}

function getURLParams() {
  console.log("Getting URL params");
  const params = new URLSearchParams(window.location.search);
  const employeeId = params.get('employeeId');
  const employeeName = params.get('employeeName');
  const salaryPerDay = params.get('salaryPerDay');
  const month = parseInt(params.get('month')) || currentMonth;
  const year = parseInt(params.get('year')) || currentYear;

  if (!employeeId || !employeeName) {
    console.error("Missing employeeId or employeeName in URL parameters");
    return { employeeId: null, employeeName: null, salaryPerDay: 500, month, year };
  }

  return {
    employeeId,
    employeeName: decodeURIComponent(employeeName),
    salaryPerDay: parseFloat(salaryPerDay) || 500,
    month,
    year
  };
}

function getMonthName(month) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return monthNames[month - 1];
}

window.initPage = async function() {
  console.log("Initializing page");
  try {
    employeeData = {};
    attendanceRecords = [];
    tableData = {};

    const { employeeId, employeeName, salaryPerDay, month, year } = getURLParams();
    currentMonth = month;
    currentYear = year;
    
    if (!employeeId || !employeeName) {
      console.warn("Invalid URL parameters, using defaults");
      employeeData = { employeeId: "Unknown", employeeName: "Unknown", salaryPerDay: 500 };
      const headerLogoFallback = document.querySelector('.header-logo');
      if (headerLogoFallback) {
        headerLogoFallback.textContent = "Attendance for Unknown Employee";
      }
      const dailyAmountFallback = document.getElementById('dailyAmount');
      if (dailyAmountFallback) {
        dailyAmountFallback.value = 500;
      } else {
        console.error("Daily amount input not found during fallback");
      }
      window.generateTable();
      return;
    }
    
    employeeData = { employeeId, employeeName, salaryPerDay };
    console.log("Employee data:", employeeData);
    
    const headerLogo = document.querySelector('.header-logo');
    if (headerLogo) {
      headerLogo.textContent = `Attendance for ${employeeName} - ${getMonthName(currentMonth)} ${currentYear}`;
    } else {
      console.error("Header logo element not found");
    }
    
    const dailyAmountInput = document.getElementById('dailyAmount');
    if (dailyAmountInput) {
      dailyAmountInput.value = salaryPerDay;
    } else {
      console.error("Daily amount input not found");
      throw new Error("Daily amount input element missing from DOM");
    }
    
    await getCurrentUser();
    await loadTableData();
    console.log("Calling generateTable after loading data");
    window.generateTable();
    window.updateControlForm(formatDate(new Date()));
  } catch (error) {
    console.error('Error initializing page:', error.message);
    alert(`Initialization failed: ${error.message}. Displaying available data if any.`);
    window.generateTable();
  }
};

async function getCurrentUser() {
  console.log("Fetching current user");
  try {
    const token = getToken();
    if (!token) {
      console.warn("No authentication token found, proceeding without user data");
      currentUser = null;
      return;
    }
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      currentUser = data.data;
      console.log("Current user:", currentUser);
    } else {
      throw new Error(data.message || 'Failed to get user data');
    }
  } catch (error) {
    console.error('Error getting current user:', error.message);
    currentUser = null;
  }
}

async function loadTableData() {
  console.log("Loading table data for employee:", employeeData.employeeId);
  try {
    const token = getToken();
    if (!token || !employeeData.employeeId) {
      console.warn("No token or employeeId, skipping table data fetch");
      tableData = {};
      return;
    }

    const url = `/api/attendance/table-data/${employeeData.employeeId}?month=${currentMonth}&year=${currentYear}`;
    console.log("Fetching from URL:", url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load table data: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      tableData = data.data;
      console.log("Loaded table data:", tableData);
    } else {
      throw new Error(data.message || 'Failed to get table data');
    }
  } catch (error) {
    console.error('Error loading table data:', error);
    tableData = {};
  }
}

async function saveTableData() {
  console.log("Saving table data for employee:", employeeData.employeeId);
  try {
    const token = getToken();
    if (!token || !employeeData.employeeId) {
      throw new Error("No token or employeeId available");
    }

    const url = '/api/attendance/table-data';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        employeeId: employeeData.employeeId,
        tableData,
        month: currentMonth,
        year: currentYear
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to save table data: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to save table data');
    }

    console.log("Table data saved successfully");
  } catch (error) {
    console.error('Error saving table data:', error);
    alert(`Failed to save table data: ${error.message}`);
  }
}

async function updateRow(dateStr, element) {
  console.log(`Updating row for ${dateStr}:`, element);
  try {
    const attendanceSelect = element.querySelector('select[name="attendance"]');
    const workTimeSelect = element.querySelector('select[name="workTime"]');
    const amountInput = element.querySelector('input[name="amount"]');

    if (!attendanceSelect || !workTimeSelect || !amountInput) {
      throw new Error("Required form elements not found");
    }

    const attendanceStatus = attendanceSelect.value;
    const workTimeValue = workTimeSelect.value;
    const amountTaken = parseFloat(amountInput.value) || 0;

    // Update local table data
    tableData[dateStr] = {
      attendance: attendanceStatus,
      workTime: workTimeValue,
      amountTaken
    };

    // Save to MongoDB
    await saveTableData();

    // Update UI
    window.updateTotals();
    window.applyStyles(element);
  } catch (error) {
    console.error(`Error updating row for ${dateStr}:`, error);
    alert(`Failed to update attendance: ${error.message}`);
  }
}

async function updateSelectedRow() {
  const dateStr = document.getElementById("controlDate").value;
  const attendanceStatus = document.getElementById("controlAttendance").value;
  const workTimeValue = document.getElementById("controlWorkTime").value;
  const amountTaken = parseFloat(document.getElementById("controlAmount").value) || 0;

  try {
    // Update local table data
    tableData[dateStr] = {
      attendance: attendanceStatus,
      workTime: workTimeValue,
      amountTaken
    };

    // Save to MongoDB
    await saveTableData();

    // Update UI
    window.generateTable();
    window.updateTotals();
  } catch (error) {
    console.error('Error updating selected row:', error);
    alert(`Failed to update attendance: ${error.message}`);
  }
}

function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
}

function parseDateString(dateStr) {
  const [day, month, year] = dateStr.split('-').map(n => parseInt(n));
  return new Date(2000 + year, month - 1, day);
}

window.updateControlForm = function(dateStr) {
  console.log("Updating control form for date:", dateStr);
  const attendanceSelect = document.getElementById("controlAttendance");
  const workTimeSelect = document.getElementById("controlWorkTime");
  const amountInput = document.getElementById("controlAmount");

  if (!attendanceSelect || !workTimeSelect || !amountInput) {
    console.error("Required form elements not found");
    return;
  }

  const rowData = tableData[dateStr] || { attendance: "NO", workTime: "0", amountTaken: 0 };

  attendanceSelect.value = rowData.attendance;
  workTimeSelect.value = rowData.workTime;
  amountInput.value = rowData.amountTaken;
};

window.generateTable = function() {
  console.log("Generating table");
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) {
    console.error("Table body element not found");
    return;
  }

  tableBody.innerHTML = "";

  const dates = Object.keys(tableData).sort((a, b) => parseDateString(a) - parseDateString(b));

  dates.forEach((dateStr) => {
    const rowData = tableData[dateStr];
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = dateStr;
    row.appendChild(dateCell);

    const attendanceCell = document.createElement("td");
    const attendanceSelect = document.createElement("select");
    attendanceSelect.name = "attendance";
    attendanceSelect.value = rowData.attendance;
    attendanceSelect.innerHTML = `
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    `;
    attendanceCell.appendChild(attendanceSelect);
    row.appendChild(attendanceCell);

    const workTimeCell = document.createElement("td");
    const workTimeSelect = document.createElement("select");
    workTimeSelect.name = "workTime";
    workTimeSelect.value = rowData.workTime;
    workTimeSelect.innerHTML = `
      <option value="FULL">FULL</option>
      <option value="HALF">HALF</option>
      <option value="0">0</option>
    `;
    workTimeCell.appendChild(workTimeSelect);
    row.appendChild(workTimeCell);

    const amountCell = document.createElement("td");
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.name = "amount";
    amountInput.value = rowData.amountTaken;
    amountCell.appendChild(amountInput);
    row.appendChild(amountCell);

    tableBody.appendChild(row);
  });
};

window.updateTotals = function() {
  console.log("Updating totals");
  const totalPresent = document.getElementById("totalPresent");
  const totalAbsent = document.getElementById("totalAbsent");
  const totalEarning = document.getElementById("totalEarning");
  const totalAmountTaken = document.getElementById("totalAmountTaken");

  if (!totalPresent || !totalAbsent || !totalEarning || !totalAmountTaken) {
    console.error("Total elements not found");
    return;
  }

  let presentCount = 0;
  let absentCount = 0;
  let earning = 0;
  let amountTaken = 0;

  Object.values(tableData).forEach((rowData) => {
    if (rowData.attendance === "YES") {
      presentCount++;
      earning += rowData.workTime === "FULL" ? parseInt(employeeData.salaryPerDay) : rowData.workTime === "HALF" ? parseInt(employeeData.salaryPerDay) / 2 : 0;
    } else {
      absentCount++;
    }
    amountTaken += rowData.amountTaken;
  });

  totalPresent.textContent = presentCount.toString();
  totalAbsent.textContent = absentCount.toString();
  totalEarning.textContent = earning.toString();
  totalAmountTaken.textContent = amountTaken.toString();
};

window.applyStyles = function(element) {
  console.log("Applying styles to element:", element);
  const attendanceSelect = element.querySelector('select[name="attendance"]');
  const workTimeSelect = element.querySelector('select[name="workTime"]');
  const amountInput = element.querySelector('input[name="amount"]');

  if (!attendanceSelect || !workTimeSelect || !amountInput) {
    console.error("Required form elements not found");
    return;
  }

  const attendanceStatus = attendanceSelect.value;
  const workTimeValue = workTimeSelect.value;
  const amountTaken = parseFloat(amountInput.value) || 0;

  if (attendanceStatus === "YES") {
    element.style.backgroundColor = "lightgreen";
  } else {
    element.style.backgroundColor = "lightcoral";
  }

  if (workTimeValue === "FULL") {
    element.style.color = "black";
  } else if (workTimeValue === "HALF") {
    element.style.color = "blue";
  } else {
    element.style.color = "red";
  }

  if (amountTaken > 0) {
    element.style.fontWeight = "bold";
  } else {
    element.style.fontWeight = "normal";
  }
};