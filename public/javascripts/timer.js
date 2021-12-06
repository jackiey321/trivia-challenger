/**
 * Retrieves the amount of time left stored in the cookie
 * 
 * @returns {Number} time left
 */
function getTime() {
  // parse cookie
  const cookies = document.cookie.split(";");
  for(let i = 0; i < cookies.length; i++){
    const split = cookies[i].split('=');
    if(split[0].trim() == "time"){
        return parseInt(split[1]);
    }
  }
}

// Update the count down every 1 second
var x = setInterval(function() {
  const sec = getTime();
  const newTime = sec - 1;
  document.getElementById("time").innerHTML = "Time --> " + newTime + "s"; // update the countdown
  
  if (newTime <= 0) {
    document.location.href = '/rankings'; // go to the results page if time is up
  }
  else {
    document.cookie = "time=" + newTime; // otherwise store new time in the cookie
  }
}, 1000);
