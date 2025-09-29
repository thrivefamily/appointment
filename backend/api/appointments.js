// appointments.js

const API_BASE = "https://appointment-git-main-thrivefamilys-projects.vercel.app/api"; // Your Vercel app URL
const token = localStorage.getItem("adminToken");

// Redirect to login if no token
if (!token) {
  alert("You must login first!");
  window.location.href = "admin-login.html";
}

// Fetch all appointments
async function fetchAppointments() {
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) logout();
      throw new Error("Unauthorized or failed to fetch");
    }

    const appointments = await res.json();
    const tbody = document.getElementById("appointmentsTable");
    tbody.innerHTML = "";

    if (!appointments.length) {
      tbody.innerHTML = "<tr><td colspan='9' style='text-align:center;'>No appointments yet.</td></tr>";
      return;
    }

    appointments.forEach(app => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${app.name}</td>
        <td>${app.email}</td>
        <td>${app.phone}</td>
        <td>${app.occupation || "-"}</td>
        <td>${app.service || "-"}</td>
        <td>${app.date}</td>
        <td>${app.time}</td>
        <td><span class="btn ${app.status}">${app.status}</span></td>
        <td>
          <button class="btn approve" onclick="updateStatus('${app._id}', 'approve')">Approve</button>
          <button class="btn decline" onclick="updateStatus('${app._id}', 'decline')">Decline</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error fetching appointments:", err);
    alert("Failed to fetch appointments. Check console.");
  }
}

// Update appointment status
async function updateStatus(id, action) {
  try {
    const res = await fetch(`${API_BASE}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) {
      if (res.status === 401) logout();
      const data = await res.json();
      alert(data.message || "Failed to update status");
      return;
    }

    const data = await res.json();
    alert(data.message);
    fetchAppointments();
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Failed to update status. Check console.");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "admin-login.html";
}

// Fetch appointments on page load
fetchAppointments();
