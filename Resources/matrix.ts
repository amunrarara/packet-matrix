// Alternative colors:
// #ffbf00
// #fcf805
// #442bff
// #7d22f4
// #0f0

// Color Palette:
// Green
// White
// Red
// Blue

(function () {
    "use strict";

    const root = this;

    const canvas: HTMLCanvasElement | null = document.getElementById("matrix") as HTMLCanvasElement | null;

    if (!canvas) throw new Error("Canvas not found");

    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
        let canvasWidth = window.innerWidth;
        let canvasHeight = window.innerHeight;

        canvas.width = canvasWidth * window.devicePixelRatio;
        canvas.height = canvasHeight * window.devicePixelRatio;
        canvas.style.width = canvasWidth + "px";
        canvas.style.height = canvasHeight + "px";

        canvas.getContext('2d')?.scale(window.devicePixelRatio, window.devicePixelRatio);
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    const Pool = function (size: number) {
        let data = [];
        let maxPoolSize = size;

        const fetch = function () {
            const fetchSize = maxPoolSize - data.length;
            if (fetchSize <= 0) {
                return;
            }

            console.log("fetching: %s", fetchSize);

            // intercept with node_pcap

            $.ajax({
                url: 'https://github-matrix.herokuapp.com/fetch',
                cache: false,
                data: {fetchSize: fetchSize}
            }).done(function (result) {
                $.each(result, function (i, drop) {
                    data.push(new Drop(drop));
                });

                if (!Pool.ready && data.length >= (maxPoolSize / 2)) {
                    console.log('pool is ready');
                    Pool.onReady.call(root);
                    Pool.ready = true;
                }
            });

        };

        this.next = function () {
            return data.pop();
        };

        this.hasNext = function () {
            return data.length > 0;
        };

        this.setMaxPoolSize = function (newSize) {
            maxPoolSize = newSize;
        };

        this.schedule = function (onReady) {
            if (Pool.scheduling) {
                return;
            }

            console.log('scheduling pool');

            Pool.ready = false;
            Pool.onReady = onReady;
            Pool.scheduling = true;

            fetch();
            setInterval(fetch, 5000);
        };
    };

    const Drop = function (commit) {
        const text = '@' + commit.user + commit.code;

        this.draw = function (ctx, posX, posY, y) {
            if (y < commit.user.length + 1) {
                ctx.shadowColor = '#7d22f4';
                ctx.fillStyle = "#7d22f4";
            } else {
                ctx.fillStyle = "#442bff";
                ctx.shadowColor = '#442bff';
            }

            const char = text[y] || '';
            ctx.fillText(char, posX, posY);
        };
    };

    const Matrix = function (options) {
        let canvas = options.canvas,
            ctx = canvas.getContext("2d"),
            pool = new Pool(200),
            that = this,
            interval,
            numColumns,
            columns,
            drops = [];

        const initialize = function () {
            numColumns = Math.floor(canvas.width / options.fontSize);
            pool.setMaxPoolSize(numColumns * 2);
            columns = [];

            for (let col = 0; col < numColumns; col++) {
                columns[col] = canvas.height;
            }
        };

        const isReset = function (posY) {
            return posY > canvas.height && Math.random() > options.randomFactor;
        };

        const drawBackground = function () {
            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(0, 0, 0, " + options.alphaFading + ")";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const drawText = function () {
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 3;
            ctx.font = options.fontSize + "px 'Courier New'";

            for (let x = 0; x < columns.length; x++) {
                let posX = x * options.fontSize;
                let posY = columns[x] * options.fontSize;
                let y = columns[x] - 1;

                let drop = drops[x];
                if (!drop) {
                    drop = pool.next();
                    drops[x] = drop;
                }

                drop.draw(ctx, posX, posY, y);

                if (isReset(posY)) {
                    columns[x] = 0;
                    if (pool.hasNext()) {
                        drops[x] = null;
                    }
                }

                columns[x]++;
            }
        };

        const draw = function () {
            drawBackground();
            drawText();
        };

        this.start = function () {
            new Intro(options)
                .start()
                .then(function () {
                    pool.schedule(function () {
                        initialize();
                        that.play();
                        $(canvas).css('cursor', 'pointer');
                        $('.controls').show();
                    });
                });
        };

        this.pause = function () {
            if (!interval) return;

            console.log('pause');
            clearInterval(interval);
            interval = null;

            $('.play-toggle')
                .attr('title', 'Play [SPACE]')
                .find('.fa')
                .removeClass('fa-pause')
                .addClass('fa-play');
        };

        this.play = function () {
            if (interval) return;

            console.log('play');
            interval = setInterval(draw, options.intervalTime);

            $('.play-toggle')
                .attr('title', 'Pause [SPACE]')
                .find('.fa')
                .removeClass('fa-play')
                .addClass('fa-pause');
        };

        this.toggle = function () {
            if (interval) {
                this.pause();
            } else {
                this.play();
            }
        };


        $(window).on('resize', _.debounce(function () {
            that.pause();

            console.log('re-initialize after resize');
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
            initialize();

            that.play();
        }, 300));

    };

    const Intro = function (options) {
        const canvas = options.canvas;
        const ctx = canvas.getContext("2d");

        const xMax = Math.floor(canvas.width / options.fontSize);
        const yMax = Math.ceil(canvas.height / options.fontSize);

        const draw = function () {
            drawBackground();
            drawNumbers();
        };

        const drawBackground = function () {
            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(, 0, 0, 0.75)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const drawNumbers = function () {
            for (let x = 1; x < xMax; x++) {
                if (x % 16 === 0) continue;

                for (let y = 1; y < yMax; y++) {
                    //if (y % 16 === 0) continue;

                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.shadowBlur = 3;
                    ctx.font = options.fontSize + "px 'Courier New'";
                    ctx.fillStyle = "#000000";
                    ctx.shadowColor = '#0f0';

                    let posX = x * options.fontSize;
                    let posY = y * options.fontSize;

                    let num = Math.ceil(Math.random() * 9);
                    if (Math.random() > 0.99) {
                        num = 'π';
                    }

                    ctx.fillText(String(num), posX, posY);
                }
            }
        };

        this.start = function () {
            console.log('starting intro');
            let that = this;
            let interval = setInterval(draw, 150);
            setTimeout(function () {
                console.log('ending intro');
                clearInterval(interval);
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                that.start.then();
            }, 2000);
            return that;
        };

        this.then = function (fn) {
            this.start.then = fn;
        };
    };

    let matrix = new Matrix({
        canvas: canvas,
        fontSize: 14,
        alphaFading: 0.04,
        randomFactor: 0.995,
        intervalTime: 120
    });
    matrix.start();

})();
