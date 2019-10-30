$(function() {
  "use strict";

  let sketchName;

  if (localStorage.getItem("modalNoShow") == "true") {
    $(".modal").hide();
  }

  //----------------------------------------------------
  // Initialize Firebase
  //----------------------------------------------------
  var firebaseConfig = {
    apiKey: "AIzaSyAopFthZIqUfAoFBptroAB8AVU5F9FwBdM",
    authDomain: "powerpointsketch.firebaseapp.com",
    databaseURL: "https://powerpointsketch.firebaseio.com",
    projectId: "powerpointsketch",
    storageBucket: "powerpointsketch.appspot.com",
    messagingSenderId: "148057977730",
    appId: "1:148057977730:web:98aeccc415767c66ac559b"
  };

  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  let userId, userName;
  //----------------------------------------------------
  // Login Check
  //----------------------------------------------------
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      user = firebase.auth().currentUser;
      userId = user.uid;
      userName = user.displayName;
      // console.log("user = " + JSON.stringify(user));
      console.log("userId for 認証 = " + userId);
      console.log("userName for 認証 = " + userName);

      //Redirect
      const redirect = filename => {
        location.href = filename;
      };

      // database.ref("users/" + userId + "/memo01").set({
      //   data: "USER01のデータ"
      // });
      $(".login").html(
        '<div class="menu">Menu' +
          '<ul class="dropdownMenu"><li class="newSketch"><a href="#">New Sketch</a>' +
          '<div class="newSketchNameBox"><div for="canvasText">新たに作成するSketch名</div><div><input type="text" id="newSketchNameText"></div></div></li>' +
          '<li><a href="#">Saved data</a></li><li><a href="#!">Share</a></li><li id="signout"><a>Sign out</a></li></ul></div>'
      );

      //----------------------------------------------------
      //Menuイベント
      //----------------------------------------------------
      //New Sketch
      $("#newSketchNameText").on("keydown", function(e) {
        if (e.keyCode == 13 && $("#newSketchNameText").val() != "") {
          sketchName = $("#newSketchNameText").val();
          console.log("new create sketchName = " + sketchName);
          $("#newSketchNameText").val("");
          $(".modalBeforeLogin").hide();

          //----------------------------------------------------
          //受信
          //----------------------------------------------------

          database
            .ref("users/" + userId + "/" + sketchName)
            .on("value", function(data) {
              try {
                const storylineDatabase = data.val().storyline;
                console.log("sketchName for 受信 = " + sketchName);
                console.log("userId for 受信 = " + userId);
                console.log(
                  "storylineDatabase for 受信 = " + storylineDatabase
                );
                $("#storylineInput").val("");
                $("#storylineInput").val(storylineDatabase + "---");
              } catch (e) {
                console.log("[storyline] on firebase is not set");
              }
            });
        }
      });

      //Sing out
      $("#signout").on("click", function() {
        // console.log("singing out...");
        firebase
          .auth()
          .signOut()
          .then(function() {
            redirect("login.html");
          })
          .catch(function(error) {
            alert("Out Error");
          });
      });
    } else {
      //Not Login
      redirect("login.html");
    }
  });
  //----------------------------------------------------

  $("#storylineInput").on("input", function() {
    let regExp = /\r?\n\r?\n/g;
    let slides;
    let input_text = $("#storylineInput").val();
    let regExpMessage = /●.+\n/;
    let regExpTitle = /・.+\n/;
    let regExpBodies = /\sー.+/g;
    let canvasFlag = false;
    let status;

    //----------------------------------------------------
    //データ送信
    //----------------------------------------------------
    localStorage.setItem("storyline", input_text);
    console.log("userId for 送信 = " + userId);
    if (sketchName != null) {
      database.ref("users/" + userId + "/" + sketchName).set({
        storyline: input_text
      });
      console.log("writing on firebase...: " + input_text);
    }

    slides = input_text.split(regExp);
    //空白や記法が違うのものを削除
    slides = $.grep(slides, function(content) {
      return (
        content != "" &&
        (content.match(regExpMessage) || content.match(regExpTitle))
      );
    });
    // console.log("slides = " + slides);

    //----------------------------------------------------
    // StorylineからSketchへのリアルタイム反映処理
    //----------------------------------------------------
    $("#sketch").html("");
    for (let i = 0; i < slides.length; i++) {
      let message;
      let title;
      let bodies = [];
      let body;
      let messageHTML = "";
      let titleHTML = "";
      let bodiesHTML = "";

      // console.log("slide[i] = " + slides[i]);
      message = slides[i].match(regExpMessage);
      title = slides[i].match(regExpTitle);
      while ((body = regExpBodies.exec(slides[i]))) {
        bodies.push(body);
      }
      // console.log("message = " + message);
      // console.log("title = " + title);
      // console.log("bodies = " + bodies);
      message == null
        ? (messageHTML = "")
        : (messageHTML =
            '<textarea class="messageTextarea">' +
            message.toString().slice(1, message.toString().length - 1) +
            "</textarea>");
      title == null
        ? (titleHTML = "")
        : (titleHTML =
            '<textarea class="titleTextarea">' +
            title.toString().slice(1, title.toString().length - 1) +
            "</textarea>");
      bodies == ""
        ? (bodiesHTML = "")
        : (bodiesHTML =
            '<div class="bodiesBox" id="bodiesBox_' + i + '"></div>');

      // console.log("messageHTML = " + messageHTML);
      // console.log("titleHTML = " + titleHTML);
      // console.log("bodiesHTML = " + bodiesHTML);
      $("#sketch").append('<div id="slide_' + i + '" class="slide"></div>');
      $("#slide_" + i).append(
        '<div id="slideTextareaBox_' +
          i +
          '" class="slideTextareaBox" >' +
          messageHTML +
          titleHTML +
          bodiesHTML +
          "</div>"
      );

      for (let num = 0; num < bodies.length; num++) {
        // console.log("i = " + i);
        // console.log("num = " + num);
        // console.log("body = " + bodies[num]);
        // console.log("body after slice = " + bodies[num].toString().slice(2));
        $("#bodiesBox_" + i).append(
          '<textarea class="body">' +
            bodies[num].toString().slice(2, bodies[num].toString().length) +
            "</textarea>"
        );
      }

      if (localStorage.getItem("slideImg_" + i)) {
        $("#slideTextareaBox_" + i).append(
          '<div class="img_box" id="img_box_' +
            i +
            '"><img class="thumbnail" src="' +
            localStorage.getItem("slideImg_" + i) +
            '"></div>'
        );
      }

      autosize($(".messageTextarea"));
      autosize($(".titleTextarea"));
      autosize($(".body"));

      $("#slide_" + i).on("dblclick", function() {
        $("#slide_" + i).toggleClass("slideExpand fontExpand");
        $(".messageTextarea ").removeAttr("style");
        $(".titleTextarea ").removeAttr("style");
        $(".body ").removeAttr("style");
        $(".messageTextarea ").toggleClass("heightExpand");
        $(".titleTextarea ").toggleClass("heightExpand");
        $(".body ").toggleClass("heightExpand");
        $("#img_box_" + i).remove();

        // console.log("canvasFlag = " + canvasFlag);
        if (canvasFlag == false) {
          $("#slideTextareaBox_" + i).append(
            '<canvas id="drowarea_' +
              i +
              '" width="1110" height="490" style="border:1px solid blue;"></canvas>'
          );
          $("#slide_" + i).append(
            '<nav><button id="clear_btn">クリアー</button><input type="color" id="color" value="#333333"><input type="range" id="lineWidth" name="lineWidth" min="1" max="20" value="1"><lable for="lineWidth">線の太さ</lable><button type="button" id="drowingmodeSelectBtn">図形の選択</button><input type="text" id="canvasText" name="canvasText"><lable for="canvasText">テキスト入力</lable></nav>'
          );
          //初期化(変数letで宣言)
          let canvas_mouse_event = false; //スイッチ [ true=線を引く, false=線は引かない ]  ＊＊＊
          let oldX = 0; //１つ前の座標を代入するための変数
          let oldY = 0; //１つ前の座標を代入するための変数
          let bold_line = 1; //ラインの太さをここで指定
          let color = "#333333"; //ラインの色をここで指定
          let canvas = new fabric.Canvas("drowarea_" + i);
          canvas.isDrawingMode = true;
          $("#slide_" + i).draggable("disable");

          if (localStorage.getItem("slide_" + i)) {
            canvas.loadFromJSON(localStorage.getItem("slide_" + i)).renderAll();
          }

          $("#clear_btn").on("click", function() {
            canvas.clear().renderAll();
          });

          $("#color").on("change", function(e) {
            canvas.freeDrawingBrush.color = e.target.value;
          });

          $("#lineWidth").on("change", function(e) {
            canvas.freeDrawingBrush.width = e.target.value;
          });

          $("#drowingmodeSelectBtn").on("click", function() {
            canvas.isDrawingMode = !canvas.isDrawingMode;
          });

          $("#canvasText").on("change", function(e) {
            let canvasText = new fabric.Text(e.target.value, {
              left: 100,
              top: 100
            });
            canvas.add(canvasText);
          });

          canvas.on("after:render", function() {
            localStorage.setItem("slide_" + i, JSON.stringify(canvas));
          });
          canvasFlag = true;
        } else {
          $("#img_box_" + i).remove();
          $("#slideTextareaBox_" + i).append(
            '<div class="img_box" id="img_box_' +
              i +
              '"><img class="thumbnail" src="' +
              $("#drowarea_" + i)[0].toDataURL() +
              '"></div>'
          );
          localStorage.setItem(
            "slideImg_" + i,
            $("#drowarea_" + i)[0].toDataURL()
          );
          $(".canvas-container").remove();
          $("nav").remove();
          $("#slide_" + i).draggable("enable");
          canvasFlag = false;
        }

        for (let index = 0; index < $(".slide").length; index++) {
          if (index != i) {
            $("#slide_" + index).toggleClass("slideHide");
          }
        }
      });

      $("#slide_" + i).draggable();
    }
  });

  //----------------------------------------------------
  // SketchからStorylineへのリアルタイム反映処理
  //----------------------------------------------------
  $("#sketch").on("input", function() {
    let input_sketch = "";
    let slideCount = $(".slide").length;
    for (let i = 0; i < slideCount; i++) {
      input_sketch +=
        "●" + $("#slideTextareaBox_" + i + " > .messageTextarea").val() + "\n";
      input_sketch +=
        "・" + $("#slideTextareaBox_" + i + " > .titleTextarea").val() + "\n";
      $("#bodiesBox_" + i + " > .body").each(function(index, content) {
        input_sketch += "ー" + $(content).val() + "\n";
      });
      input_sketch += "\n";
    }
    // console.log("input_sketch = " + input_sketch);
    $("#storylineInput").val("");
    $("#storylineInput").val(input_sketch);
    localStorage.setItem("storyline", input_sketch);
  });

  // 元の場所に戻す
  $("#resetPs").on("click", function() {
    $("#storylineInput").trigger("input");
  });

  // 全てリセット
  $("#resetAll").on("click", function() {
    if (confirm("本当に全てリセットしますか？")) {
      localStorage.clear();
      $("#storylineInput").val("");
      $("#storylineInput").trigger("input");
    }
  });

  $("#start").on("click", function() {
    $(".modal").fadeOut(500);
    // console.log("checked? = " + $("#checkbox").prop("checked"));
    localStorage.setItem("modalNoShow", $("#checkbox").prop("checked"));
  });

  $("#storylineInput")
    .val(localStorage.getItem("storyline"))
    .trigger("input");
});

/*
●メッセージ１
・タイトル1
ーボディ１−１
ーボディ１−２



●メッセージ２
・タイトル２
ーボディ２−１
ーボディ２−２

●メッセージ３
・タイトル３
ーボディ３−１
ーボディ３−２

*/
