var stripe = Stripe("pk_live_51JAhG7KLrMOnvMuZrF60VL91bAktd7aOVunjKIjhyXOF5XQPwcBaMbWbFdtWvb3DKO7qyQkM1W6X75IriADAFmpv00OW4v8fWc");
const dbRef = firebase.database().ref();
var eid = localStorage.getItem("eid");

document.getElementById("amount").value = 10.00.toFixed(2)

function pretty() {
  var amount = document.getElementById("amount").value
  amount = parseFloat(amount) * 100
  if (isNaN(amount)) {
    document.getElementById("amount").classList.add("error-input")
    return false
  }
  if (amount < 0) {
    amount = 0
  }
  document.getElementById("amount").value = (amount/100).toFixed(2)
}

function increment(direction) {
  var amount = document.getElementById("amount").value
  amount = parseFloat(amount) * 100
  if (isNaN(amount)) {
    amount = 0
  }
  if (direction) {
    amount += 1000
  } else {
    if (amount < 1000) {
      return
    }
    amount -= 1000
  }
  document.getElementById("amount").classList.remove("error-input")
  document.getElementById("amount").value = (amount/100).toFixed(2)
}

function cancel() {
  window.location.replace('/donate')
}

function emailPopup() {
  document.getElementById("email-form").classList.remove("hidden")
  document.getElementById("my-body").classList.add("blur")
  document.getElementById("title").classList.add("blur")
  document.querySelector("header").classList.add("blur")
}

function validate(change) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var email = document.getElementById("email")
  if (!re.test(String(email.value).toLowerCase())) {
    email.classList.add("error-input")
    return
  }
  email.classList.remove("error-input")
  if (!change) {
    return
  }
  document.getElementById("email-form").classList.add("hidden")
  var recur = document.getElementById("recur").value
  if (recur !== "one") {
    document.getElementById("recur").classList.add("error-input")
    console.log(recur)
    return false;
  }
  document.getElementById("recur").classList.remove("error-input")
  var amount = document.getElementById("amount").value
  amount = parseFloat(amount) * 100
  if (isNaN(amount)) {
    document.getElementById("amount").classList.add("error-input")
    console.log("Need a number")
    return false
  }
  if (amount > 99999999 || amount < 50) {
    alert("The donation must be between $0.50 and $999,999.99")
    return false
  }
  createIntent(amount)
}

function createIntent(amount) {
  document.querySelector("button").disabled = true;
  const email = document.getElementById("email").value;
  fetch("/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      amount: amount
    })
  })
    .then(function(result) {
      return result.json();
    })
    .then(function(data) {
      var elements = stripe.elements();

      var style = {
        base: {
          color: "#32325d",
          fontFamily: 'Arial, sans-serif',
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#32325d"
          }
        },
        invalid: {
          fontFamily: 'Arial, sans-serif',
          color: "#fa755a",
          iconColor: "#fa755a"
        }
      };

      var card = elements.create("card", { style: style });

      document.getElementById("payment-form").classList.remove("hidden")
      document.getElementById("my-body").classList.add("blur")
      document.getElementById("title").classList.add("blur")
      document.querySelector("header").classList.add("blur")

      card.mount("#card-element");

      card.on("change", function (event) {
        document.querySelector("#submit").disabled = event.empty;
        document.querySelector("#error").textContent = event.error ? event.error.message : "";
      });

      document.addEventListener("submit", (event) => {
        event.preventDefault();
        payWithCard(stripe, card, data.clientSecret, data.id);
      });
    });
};

function payWithCard(stripe, card, clientSecret, id) {
  loading(true);
  document.getElementById("submit").disabled = true;
  if (eid !== null) {
    dbRef.child("Payment Intents").child(id).set(eid)
  }
  stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: card
    }
  })
  .then((result) => {
    if (result.error) {
      dbRef.child("Payment Intents").child(id).set(null)
      showError(result.error.message);
    } else {
      orderComplete();
    }
  });
};

function orderComplete() {
  loading(false);
  document.getElementById("payment-form").classList.add("hidden")
  document.getElementById("my-body").classList.remove("blur")
  document.getElementById("title").classList.remove("blur")
  document.querySelector("header").classList.remove("blur")
  window.location.replace("/success")
};

function showError(errorMsgText) {
  loading(false);
  document.getElementById("submit").disabled = false;
  var errorMsg = document.getElementById("error");
  errorMsg.textContent = errorMsgText;
};

function loading(isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.getElementById("spinner").classList.add("hidden");
    document.getElementById("button-text").classList.remove("hidden");
  }
};

