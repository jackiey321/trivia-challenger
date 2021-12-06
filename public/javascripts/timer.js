function getTime() {
  const cookies = document.cookie.split(";");
  for(let i = 0; i < cookies.length; i++){
    const split = cookies[i].split('=');
    if(split[0].trim() == "time"){
        return split[1];
    }
  }
}

// Update the count down every 1 second
var x = setInterval(function() {
  const sec = getTime();
  const newTime = (parseInt(sec) - 1).toString();
  document.getElementById("time").innerHTML = "Time --> " + newTime + "s";

  // If the count down is finished, write some text
  if (parseInt(newTime) <= 0) {
    document.location.href = '/rankings';
  }
  else {
    document.cookie = "time=" + newTime;
  }
}, 1000);
