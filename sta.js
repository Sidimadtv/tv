window.addEventListener("load", function(){

  var starStyles = ["style1","style2","style3","style4"];
  var starSizes  = ["tam1","tam1","tam1","tam2","tam3"];
  var starOpacity= ["opacity1","opacity1","opacity1","opacity2","opacity2","opacity3"];

  function rand(min,max){ return Math.floor(Math.random()*(max-min))+min; }

  // --- Stars ---
  var constellation = document.querySelector(".constelacao");
  if(constellation){
    var width = window.innerWidth;
    var height = window.innerHeight;

    for(var i=0;i<500;i++){
      var star = document.createElement("span");
      star.className = "estrela " 
                        + starStyles[rand(0,starStyles.length)] + " " 
                        + starSizes[rand(0,starSizes.length)] + " " 
                        + starOpacity[rand(0,starOpacity.length)];
      star.style.left = rand(0,width)+"px";
      star.style.top  = rand(0,height)+"px";
      star.style.animationDelay = "."+rand(0,9)+"s";
      constellation.appendChild(star);
    }
  }

  // --- Meteors ---
  function spawnMeteor(){
    var meteor = document.createElement("div");
    meteor.className = "meteoro " + starStyles[rand(0,starStyles.length)];
    var chuva = document.querySelector(".chuvaMeteoro");
    if(chuva){
      chuva.appendChild(meteor);
      setTimeout(function(){ chuva.removeChild(meteor); }, 1000);
    }
    setTimeout(spawnMeteor, rand(5000,10000));
  }

  setTimeout(spawnMeteor, rand(5000,10000));

  // --- Optional: Reposition stars on window resize ---
  window.addEventListener("resize", function(){
    var stars = document.querySelectorAll(".constelacao .estrela");
    var w = window.innerWidth;
    var h = window.innerHeight;
    stars.forEach(function(s){
      s.style.left = rand(0,w)+"px";
      s.style.top  = rand(0,h)+"px";
    });
  });

});
