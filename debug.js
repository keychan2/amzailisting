// Debug script to check auth functionality
console.log('Debug script loaded');

// Add event listener to registration tab
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  
  // Log when tabs are clicked
  const registerTab = document.getElementById('register-tab');
  if (registerTab) {
    console.log('Register tab found');
    registerTab.addEventListener('click', function() {
      console.log('Register tab clicked');
    });
  } else {
    console.log('Register tab not found');
  }
  
  // Log when register buttons are clicked
  const registerEmailBtn = document.getElementById('register-email-btn');
  if (registerEmailBtn) {
    console.log('Register email button found');
    registerEmailBtn.addEventListener('click', function() {
      console.log('Register email button clicked');
      console.log('Email:', document.getElementById('register-email').value);
      console.log('Code:', document.getElementById('register-email-code').value);
    });
  } else {
    console.log('Register email button not found');
  }
  
  // Override the registerWithEmail function to add debugging
  window.originalRegisterWithEmail = window.registerWithEmail;
  window.registerWithEmail = function() {
    console.log('registerWithEmail function called');
    
    const email = document.getElementById('register-email').value;
    const code = document.getElementById('register-email-code').value;
    const password = document.getElementById('register-email-password').value;
    const confirm = document.getElementById('register-email-confirm').value;
    
    console.log('Registration data:', { email, code, password: '***', confirm: '***' });
    
    // Call the original function
    if (window.originalRegisterWithEmail) {
      console.log('Calling original registerWithEmail function');
      return window.originalRegisterWithEmail.apply(this, arguments);
    } else {
      console.error('Original registerWithEmail function not found');
    }
  };
  
  // Add direct click handler to the registration button
  document.getElementById('register-email-btn').onclick = function() {
    console.log('Direct click on register button');
    registerWithEmail();
  };
});

// Add a function to manually switch to registration tab
window.showRegistrationTab = function() {
  console.log('Manually showing registration tab');
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('forgot-password-form').style.display = 'none';
  document.getElementById('login-tab').classList.remove('active');
  document.getElementById('register-tab').classList.add('active');
};
