# Implementing Scripts in Calendesk Websites

## Introduction

Calendesk websites utilize dynamic content loading, which presents unique challenges when implementing custom JavaScript. This guide provides a comprehensive approach to successfully integrating scripts into Calendesk websites, ensuring they function correctly despite the platform's dynamic content loading behavior.

## Core Challenges with Calendesk

1. **Dynamic DOM Loading**: Content loads asynchronously, meaning your elements might not exist when scripts first execute
2. **Head-Only Script Placement**: Scripts can often only be added to the `<head>`, not at the end of body
3. **Platform Restrictions**: Potential API limitations and conflicts with Calendesk's own JavaScript

## Implementation Strategy

### Script Architecture

Always use a namespaced approach with encapsulated code:

```javascript
window.YourNamespace = (function () {
  // Private variables and methods
  let initialized = false;

  // Public API
  return {
    init: function () {
      // Initialization code
    },
  };
})();
```

### Element Detection Methods

#### Using MutationObserver (Recommended)

MutationObserver watches for DOM changes and executes your code when target elements appear:

```javascript
function setupMutationObserver() {
  observer = new MutationObserver(function (mutations) {
    for (let mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.classList &&
              node.classList.contains("your-target-class")
            ) {
              initializeYourFeature(node);
              observer.disconnect();
              return;
            }
          }
        }
      }
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
}
```

#### Multiple Loading Events

Cover all possible loading scenarios:

```javascript
// Try immediate initialization
if (document.readyState !== "loading") {
  tryInitialize();
}

// Set up standard DOM listeners
document.addEventListener("DOMContentLoaded", tryInitialize);
window.addEventListener("load", tryInitialize);

// Fallback with timeout
setTimeout(tryInitialize, 1000);
```

### Event Delegation

Always use event delegation for dynamically added elements:

```javascript
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("your-button-class")) {
    handleButtonClick(event);
  }
});
```

### Defensive Coding Practices

Always check for element existence before operating on them:

```javascript
function updateElement() {
  const element = document.getElementById("your-element");
  if (!element) {
    console.warn("Element not found");
    return;
  }

  // Now it's safe to use the element
  element.textContent = "Updated content";
}
```

## Implementation Example

Below is a complete example based on our successful implementation:

```javascript
// Create a global namespace for your functionality
window.YourFeature = (function () {
  // Private variables
  let initialized = false;
  let observer = null;

  // Public API
  const publicAPI = {
    init: function () {
      if (initialized) return;

      // Try immediate initialization
      if (document.readyState !== "loading") {
        tryInitialize();
      }

      // Standard DOM ready listeners
      document.addEventListener("DOMContentLoaded", tryInitialize);
      window.addEventListener("load", tryInitialize);

      // Set up MutationObserver to watch for elements
      setupMutationObserver();

      console.log("Initialization setup complete");
    },
  };

  function tryInitialize() {
    if (initialized) return;

    const targetElement = document.querySelector(".your-target-element");
    if (targetElement) {
      initializeFeature(targetElement);

      // Clean up observer
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    } else {
      console.log("Target element not found, waiting for it to appear...");
    }
  }

  function setupMutationObserver() {
    if (!window.MutationObserver) {
      console.warn("MutationObserver not supported");
      return;
    }

    observer = new MutationObserver(function (mutations) {
      for (let mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (
                node.classList &&
                node.classList.contains("your-target-element")
              ) {
                initializeFeature(node);
                observer.disconnect();
                observer = null;
                return;
              } else if (
                node.querySelector &&
                node.querySelector(".your-target-element")
              ) {
                const target = node.querySelector(".your-target-element");
                initializeFeature(target);
                observer.disconnect();
                observer = null;
                return;
              }
            }
          }
        }
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function initializeFeature(element) {
    if (initialized) return;

    try {
      // Your initialization code
      setupEventListeners();

      initialized = true;
      console.log("Feature initialized successfully");
    } catch (error) {
      console.error("Error initializing:", error);
    }
  }

  function setupEventListeners() {
    // Use event delegation
    document.addEventListener("click", function (event) {
      if (event.target.classList.contains("your-button")) {
        handleButtonClick(event);
      }
    });
  }

  return publicAPI;
})();

// Auto-initialize
window.YourFeature.init();

// Manual initialization function
function initYourFeature() {
  if (window.YourFeature) {
    window.YourFeature.init();
  } else {
    console.error("Feature not available");
  }
}
```

## Adding Scripts to Calendesk

1. **In Calendesk Admin Panel**:

   - Navigate to your website settings
   - Find the "Custom Code" or "Scripts" section
   - Paste your script or add a reference to your external script file

2. **External Script Reference**:

   ```html
   <script src="https://your-domain.com/your-script.js"></script>
   ```

3. **Inline Script**:

   ```html
   <script>
     // Your script code
   </script>
   ```

4. **Manual Trigger in HTML**:
   ```html
   <script>
     // Force initialization after page load
     window.addEventListener("load", function () {
       setTimeout(function () {
         if (window.YourFeature) {
           window.YourFeature.init();
         }
       }, 1000);
     });
   </script>
   ```

## Troubleshooting

If your script isn't working as expected:

1. **Check Console for Errors**: Open browser developer tools (F12) and check for errors
2. **Add Debug Logging**: Insert console.log statements at key points to track execution
3. **Verify Element Classes/IDs**: Ensure your selectors match the actual elements in the DOM
4. **Increase Timeout Values**: Try longer timeouts for initialization attempts
5. **Check File Loading**: Verify your script is actually loaded by checking Network tab

## Best Practices

1. **Minimize Dependencies**: Avoid relying on external libraries when possible
2. **Keep it Lightweight**: Heavy scripts can slow down the site
3. **Clear Error Messages**: Log descriptive error messages to aid troubleshooting
4. **Clean up Resources**: Remove event listeners and observers when they're no longer needed
5. **Use Feature Detection**: Check if browser features are available before using them

## Case Study: File Upload Feature in Calendesk

Our example implementation successfully handles file uploads in Calendesk by:

1. Using MutationObserver to detect when form elements are added to the DOM
2. Employing multiple initialization attempts via different DOM events
3. Implementing event delegation for dynamically created elements
4. Adding thorough error handling and validation
5. Providing detailed console logging for troubleshooting

This approach has proven reliable even in Calendesk's dynamic environment and can be adapted for various JavaScript functionality.

## Conclusion

Successfully implementing JavaScript in Calendesk requires addressing the platform's dynamic content loading. By using a combination of MutationObserver, event delegation, and defensive coding practices, you can create robust scripts that work reliably regardless of when your elements appear in the DOM.
