(function () {
  // Keep track of selected files and counter for unique input names
  let selectedFiles = [];
  let fileCounter = 0;
  let formSubmitting = false;

  // Initialize the page
  document.addEventListener("DOMContentLoaded", function () {
    // Initialize file list
    updateFileList();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
          behavior: "smooth",
        });
      });
    });

    // Setup event listeners
    setupEventListeners();
  });

  function setupEventListeners() {
    // Handle adding files
    document
      .getElementById("file-input")
      .addEventListener("change", handleFileInput);

    // Form submission validation
    document
      .getElementById("serviceForm")
      .addEventListener("submit", handleFormSubmit);
  }

  // Handle file input changes
  function handleFileInput(e) {
    // Add newly selected files to our array
    if (this.files.length > 0) {
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showNotification(
            `Plik "${file.name}" jest zbyt duży. Maksymalny rozmiar to 10MB.`,
            "error"
          );
          continue;
        }

        // Create a hidden input for each file
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "file";
        hiddenInput.style.display = "none";
        hiddenInput.name = `file-${fileCounter}`;
        fileCounter++;

        // Create a DataTransfer object and add the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        hiddenInput.files = dataTransfer.files;

        // Add to hidden inputs container
        document.getElementById("hidden-file-inputs").appendChild(hiddenInput);

        // Add to our tracking array with reference to the input
        selectedFiles.push({
          file: file,
          inputElement: hiddenInput,
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
      }

      // Clear the visible input
      this.value = "";
    }

    // Update the displayed list
    updateFileList();
  }

  // Update the file list display
  function updateFileList() {
    const fileList = document.getElementById("file-list");
    if (!fileList) return;

    fileList.innerHTML = "";

    if (selectedFiles.length === 0) {
      return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";
      fileItem.dataset.id = selectedFiles[i].id;

      const file = selectedFiles[i].file;
      const fileSize = formatFileSize(file.size);

      fileItem.innerHTML = `
      <div class="file-info">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${fileSize}</span>
      </div>
      <button type="button" class="file-remove-btn" data-id="${selectedFiles[i].id}">✕</button>
      `;

      fileList.appendChild(fileItem);
    }

    // Add event listeners to remove buttons
    const removeButtons = document.querySelectorAll(".file-remove-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const fileId = this.getAttribute("data-id");
        removeFile(fileId);
      });
    });
  }

  // Remove a specific file
  function removeFile(fileId) {
    // Find the file in our array
    const fileIndex = selectedFiles.findIndex((item) => item.id === fileId);

    if (fileIndex !== -1) {
      // Remove the hidden input element
      const inputElement = selectedFiles[fileIndex].inputElement;
      if (inputElement && inputElement.parentNode) {
        inputElement.parentNode.removeChild(inputElement);
      }

      // Remove from our array
      selectedFiles.splice(fileIndex, 1);

      // Update the displayed list
      updateFileList();
    }
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Show notification
  function showNotification(message, type) {
    const notificationContainer = document.getElementById(
      "notification-container"
    );
    if (!notificationContainer) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
      <div class="notification-message">${message}</div>
      <button type="button" class="notification-close">✕</button>
      </div>
  `;

    // Add close button functionality
    const closeButton = notification.querySelector(".notification-close");
    closeButton.addEventListener("click", function () {
      notification.classList.add("notification-hiding");
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    });

    // Auto close after some time for success messages
    if (type === "success") {
      setTimeout(() => {
        notification.classList.add("notification-hiding");
        setTimeout(() => {
          if (notification.parentNode) {
            notificationContainer.removeChild(notification);
          }
        }, 300);
      }, 5000);
    }

    notificationContainer.appendChild(notification);

    // Add animated entrance
    setTimeout(() => {
      notification.classList.add("notification-visible");
    }, 10);
  }

  // Toggle loading state
  function setLoadingState(isLoading) {
    const submitButton = document.getElementById("submit-button");
    if (!submitButton) return;

    const spinner = document.getElementById("submit-spinner");

    if (isLoading) {
      formSubmitting = true;
      submitButton.classList.add("loading");
      spinner.style.display = "block";
      submitButton.disabled = true;
    } else {
      formSubmitting = false;
      submitButton.classList.remove("loading");
      spinner.style.display = "none";
      submitButton.disabled = false;
    }
  }

  // Handle form submission
  async function handleFormSubmit(event) {
    event.preventDefault();

    // Prevent multiple submissions
    if (formSubmitting) {
      return;
    }

    // Validate form
    const serviceSelected = document.querySelector(
      'input[name="service"]:checked'
    );

    if (!serviceSelected) {
      showNotification("Proszę wybrać jedną usługę", "error");
      return;
    }

    // Everything looks good, start loading state
    setLoadingState(true);

    const form = this;
    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        showNotification(
          "Dziękujemy! Twoja wiadomość została wysłana.",
          "success"
        );
        form.reset();
        selectedFiles = [];
        document.getElementById("hidden-file-inputs").innerHTML = "";
        fileCounter = 0;
        updateFileList();
      } else {
        const data = await response.json();
        showNotification(
          "Wystąpił problem z wysłaniem formularza. " + (data.error || ""),
          "error"
        );
      }
    } catch (error) {
      showNotification(
        "Wystąpił problem z wysłaniem formularza. Spróbuj ponownie później.",
        "error"
      );
      console.error(error);
    } finally {
      setLoadingState(false);
    }
  }
})();
