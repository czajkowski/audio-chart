/* global $, Uint8Array */

$(function () {


    // fork getUserMedia for multiple browser versions, for those
    // that need prefixes
    navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

    var audioCtx = new(window.AudioContext || window.webkitAudioContext)(),
        analyser = audioCtx.createAnalyser(),
        source,
        canvas = document.querySelector("#visualizer"),
        canvasCtx = canvas.getContext("2d"),
        canvasWidth = canvas.width,
        canvasHeight = canvas.height,
        canvasTopOffset = 50,
        bufferLength = 512,
        lines = 100,
        delayBuffer = new Array(lines);

    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    analyser.fftSize = bufferLength;

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            // constraints - only audio needed for this app
            { audio: true },

            // success callback
            function (audioStream) {
                source = audioCtx.createMediaStreamSource(audioStream);
                source.connect(analyser);

                visualize();
            },

            // error callback
            function () {}
        );
    }

    function visualize () {

        canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        function draw () {
            requestAnimationFrame(draw);

            var dataArray = new Uint8Array(bufferLength),
                i, j, sliceWidth, x, yOffset, y, v;

            analyser.getByteTimeDomainData(dataArray);


            // Remember new data
            delayBuffer.shift();
            delayBuffer.push(dataArray);


            canvasCtx.fillStyle = "rgb(0, 0, 0)";
            canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);

            canvasCtx.lineWidth = 1;
            canvasCtx.strokeStyle = "rgb(255, 255, 255)";

            sliceWidth = canvasWidth / bufferLength;

            for (i = 0; i < lines; i++) {

                x = 0;
                yOffset = ((i + 1) * (canvasHeight - canvasTopOffset) / lines) + canvasTopOffset;

                canvasCtx.moveTo(-5, yOffset + 10);
                canvasCtx.beginPath();

                for (j = 0; j < bufferLength; j++) {

                    v = ((delayBuffer[i] || [])[j] - 128.0) / 128.0;
                    y = yOffset - v * canvasTopOffset * Math.pow(Math.sin(x / canvasWidth * Math.PI), 3);

                    if (j === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                canvasCtx.lineTo(canvasWidth + 5, yOffset);
                canvasCtx.lineTo(canvasWidth + 5, yOffset + canvasHeight);
                canvasCtx.lineTo(-5, yOffset + canvasHeight);
                canvasCtx.fill();
                canvasCtx.stroke();

                canvasCtx.closePath();
            }

        }

        requestAnimationFrame(draw);
    }

});
