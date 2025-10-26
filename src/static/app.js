document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-list">
            <p><strong>Current participants:</strong></p>
            ${details.participants.length > 0 ? `<ul></ul>` : `<p class="no-participants">No participants yet</p>`}
          </div>
        `;

        // If there are participants, populate the list with items and delete buttons
        if (details.participants.length > 0) {
          const ul = activityCard.querySelector('ul');
          details.participants.forEach((participant) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'email';
            span.textContent = participant;

            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.setAttribute('aria-label', `Unregister ${participant}`);
            btn.dataset.email = participant;
            btn.dataset.activity = name;
            btn.textContent = '\u00D7'; // multiplication sign (×)

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate delete click events from participant delete buttons
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    if (!email || !activity) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
        // Refresh the activities list to reflect the change
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister participant';
        messageDiv.className = 'error';
      }

      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 4000);
    } catch (err) {
      console.error('Error unregistering participant:', err);
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
    }
  });

  // Initial load
  fetchActivities();
});
