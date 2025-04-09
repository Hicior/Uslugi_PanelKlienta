// Create a global namespace for our form functionality
window.MentzenServices = (function () {
  // Private variables
  let selectedFiles = [];
  let fileCounter = 0;
  let formSubmitting = false;
  let initialized = false;
  let observer = null;

  // Public methods and properties
  const publicAPI = {
    // Initialize the service form functionality
    init: function () {
      if (initialized) return; // Prevent double initialization

      // First try immediate initialization if DOM is already loaded
      if (document.readyState !== "loading") {
        tryInitialize();
      }

      // Set up listeners for DOM ready
      document.addEventListener("DOMContentLoaded", tryInitialize);
      window.addEventListener("load", tryInitialize);

      // Set up a MutationObserver to watch for our container being added
      setupMutationObserver();

      console.log("MentzenServices initialization setup complete");
    },
  };

  // Try to initialize if our container exists
  function tryInitialize() {
    if (initialized) return;

    const servicesWrapper = document.querySelector(".services-wrapper");
    if (servicesWrapper) {
      initializeForm(servicesWrapper);

      // If we successfully initialized, disconnect the observer
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    } else {
      console.log("Services wrapper not found, waiting for it to appear...");
    }
  }

  // Set up a MutationObserver to watch for DOM changes
  function setupMutationObserver() {
    if (!window.MutationObserver) {
      console.warn(
        "MutationObserver not supported, form may not initialize properly"
      );
      return;
    }

    observer = new MutationObserver(function (mutations) {
      for (let mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          // Check if any of the added nodes is our container or contains it
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (
                node.classList &&
                node.classList.contains("services-wrapper")
              ) {
                initializeForm(node);
                observer.disconnect();
                observer = null;
                return;
              } else if (
                node.querySelector &&
                node.querySelector(".services-wrapper")
              ) {
                const wrapper = node.querySelector(".services-wrapper");
                initializeForm(wrapper);
                observer.disconnect();
                observer = null;
                return;
              }
            }
          }
        }
      }
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    console.log("MutationObserver started to look for services-wrapper");
  }

  // Initialize the form once the container is found
  function initializeForm(wrapper) {
    if (initialized) return;

    console.log("Services wrapper found, initializing form...");

    // Initialize file list
    updateFileList();

    // Setup event listeners
    setupEventListeners();

    // Mark as initialized
    initialized = true;
    console.log("Mentzen Services form initialized successfully");
  }

  function setupEventListeners() {
    // Handle adding files
    const fileInput = document.getElementById("file-input");
    if (fileInput) {
      fileInput.addEventListener("change", handleFileInput);
      console.log("File input event listener attached");
    } else {
      console.warn("File input element not found");
    }

    // Form submission validation
    const serviceForm = document.getElementById("serviceForm");
    if (serviceForm) {
      serviceForm.addEventListener("submit", handleFormSubmit);
      console.log("Form submission event listener attached");
    } else {
      console.warn("Service form element not found");
    }

    // Add event listeners for elements inside the form
    document.addEventListener("click", function (event) {
      // Handle file remove buttons that might be added dynamically
      if (event.target.classList.contains("file-remove-btn")) {
        const fileId = event.target.getAttribute("data-id");
        if (fileId) {
          removeFile(fileId);
        }
      }
    });
  }

  // Handle file input changes
  function handleFileInput(e) {
    console.log("File input change detected, files:", this.files?.length || 0);

    // Add newly selected files to our array
    if (this.files && this.files.length > 0) {
      const hiddenInputs = document.getElementById("hidden-file-inputs");

      if (!hiddenInputs) {
        console.warn("Hidden file inputs container not found");
        return;
      }

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

        try {
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
          hiddenInputs.appendChild(hiddenInput);

          // Add to our tracking array with reference to the input
          selectedFiles.push({
            file: file,
            inputElement: hiddenInput,
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          });

          console.log(
            `Added file: ${file.name} (${formatFileSize(file.size)})`
          );
        } catch (error) {
          console.error("Error adding file:", error);
        }
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
    if (!fileList) {
      console.warn("File list element not found");
      return;
    }

    fileList.innerHTML = "";

    if (selectedFiles.length === 0) {
      console.log("No files selected, file list cleared");
      return;
    }

    console.log(`Updating file list with ${selectedFiles.length} files`);

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
  }

  // Remove a specific file
  function removeFile(fileId) {
    console.log(`Removing file with ID: ${fileId}`);

    // Find the file in our array
    const fileIndex = selectedFiles.findIndex((item) => item.id === fileId);

    if (fileIndex !== -1) {
      // Remove the hidden input element
      const inputElement = selectedFiles[fileIndex].inputElement;
      if (inputElement && inputElement.parentNode) {
        inputElement.parentNode.removeChild(inputElement);
      }

      // Remove from our array
      const removedFile = selectedFiles[fileIndex];
      selectedFiles.splice(fileIndex, 1);
      console.log(`Removed file: ${removedFile.file.name}`);

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
    if (!notificationContainer) {
      console.warn("Notification container not found");
      return;
    }

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
        if (notification.parentNode) {
          notificationContainer.removeChild(notification);
        }
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
    console.log(`Notification shown: ${type} - ${message}`);

    // Add animated entrance
    setTimeout(() => {
      notification.classList.add("notification-visible");
    }, 10);
  }

  // Toggle loading state
  function setLoadingState(isLoading) {
    const submitButton = document.getElementById("submit-button");
    if (!submitButton) {
      console.warn("Submit button not found");
      return;
    }

    const spinner = document.getElementById("submit-spinner");
    if (!spinner) {
      console.warn("Spinner element not found");
      return;
    }

    if (isLoading) {
      formSubmitting = true;
      submitButton.classList.add("loading");
      spinner.style.display = "block";
      submitButton.disabled = true;
      console.log("Form submission in progress, loading state activated");
    } else {
      formSubmitting = false;
      submitButton.classList.remove("loading");
      spinner.style.display = "none";
      submitButton.disabled = false;
      console.log("Form submission completed, loading state deactivated");
    }
  }

  // Handle form submission
  async function handleFormSubmit(event) {
    event.preventDefault();
    console.log("Form submission initiated");

    // Prevent multiple submissions
    if (formSubmitting) {
      console.log("Form already submitting, submission blocked");
      return;
    }

    // Validate form
    const serviceSelected = document.querySelector(
      'input[name="service"]:checked'
    );

    if (!serviceSelected) {
      showNotification("Proszę wybrać jedną usługę", "error");
      console.log("Form validation failed: No service selected");
      return;
    }

    // Everything looks good, start loading state
    setLoadingState(true);

    const form = this;
    const formData = new FormData(form);
    console.log("FormData created, form data being prepared for submission");

    try {
      console.log(`Submitting form to: ${form.action}`);
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        console.log("Form submitted successfully");
        showNotification(
          "Dziękujemy! Twoja wiadomość została wysłana.",
          "success"
        );
        form.reset();
        selectedFiles = [];
        const hiddenInputs = document.getElementById("hidden-file-inputs");
        if (hiddenInputs) {
          hiddenInputs.innerHTML = "";
        }
        fileCounter = 0;
        updateFileList();
      } else {
        const data = await response.json();
        console.error("Form submission failed:", data);
        showNotification(
          "Wystąpił problem z wysłaniem formularza. " + (data.error || ""),
          "error"
        );
      }
    } catch (error) {
      console.error("Error during form submission:", error);
      showNotification(
        "Wystąpił problem z wysłaniem formularza. Spróbuj ponownie później.",
        "error"
      );
    } finally {
      setLoadingState(false);
    }
  }

  // Return the public API
  return publicAPI;
})();

// Auto-initialize when loaded
window.MentzenServices.init();

// Provide a manual initialization function that can be called from HTML
function initMentzenServices() {
  if (window.MentzenServices) {
    window.MentzenServices.init();
    console.log("Manual initialization of MentzenServices triggered");
  } else {
    console.error("MentzenServices not available for manual initialization");
  }
}
