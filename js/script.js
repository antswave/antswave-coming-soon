const countDownDate = new Date("Dec 01, 2026 00:00:00").getTime();

const c = setInterval(() => {
  countTime();
}, 1000);

function countTime() {
  var nowDate = new Date().getTime();
  var distance = countDownDate - nowDate;

  var d = Math.floor(distance / (1000 * 60 * 60 * 24));
  var h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var s = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("days").innerHTML = d;
  document.getElementById("hours").innerHTML = h;
  document.getElementById("minutes").innerHTML = m;
  document.getElementById("seconds").innerHTML = s;
}
