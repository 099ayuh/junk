const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3001;
const fetch = require('node-fetch');

// my api information
var MovieAPI = process.env.APIURL;
const API_KEY = process.env.API_KEY;

// Setting tamplate engine 
app.engine('hbs', exphbs.engine({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        number: function() {
            return 1;
        },
        getNextPage: function (page) {
            return page + 1;
        },
        getPrevPage: function (page) {
            if (page === 1) {
                return page;
            } else {
                return page - 1;
            }
        }
    }
}));

app.set('view engine', 'hbs');

// static path
app.use(express.static(path.join(__dirname, 'public')))


// body parser
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// routes
app.get('/', (req, res) => {
    fetch(MovieAPI)
        .then(response => response.json())
        .then(data => {
            res.render('home', {
                title: 'home',
                DataAPI: data
                // ImageAPI : imgapi
            });
            // console.log(data.results);
        })
        .catch((err) => {
            console.log(err);
        });
    // res.render('home', {title: 'home'});
});

async function get_movie_trailer(id) {
    try {
        const resp = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`)
        const respData = await resp.json()
        const resultData = [];
        var myvar = 3;
        if (respData.results.length < myvar) {
            myvar = respData.results.length;
        }
        for (let i = 0; i < myvar; i++) {
            resultData.push(respData.results[i]);
        }
        console.log(resultData)
        return resultData
    } catch (error) {
        console.log('404 not found');
        return null;
    }
}

async function get_similar_movies(id,language) {
    try {

        const resp = await fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${API_KEY}&language=${language}&page=1`)
        const respData = await resp.json()
        return respData.results;
    } catch (error) {
        return null;
    }
}


app.get('/find/:id', (req, res) => {
    const id = req.params.id;
    console.log(id)
    const imdb_url = `https://api.themoviedb.org/3/movie/${id}/external_ids?api_key=${API_KEY}`
    // https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}
    // var video_data;
    fetch(imdb_url)
        .then(response => response.json())
        .then((result) => {
            // console.log(result.imdb_id)
            // const movie_url = `https://api.themoviedb.org/3/find/${result.imdb_id}?api_key=${API_KEY}&language=en-US&external_source=imdb_id`;
            const movie_url = `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`;
            const video_url = `https://api.themoviedb.org/3/movie/${result.id}/videos?api_key=${API_KEY}&language=en-US`
            fetch(movie_url)
                .then(resp => resp.json())
                .then(async (result) => {
                    const video_data = await get_movie_trailer(result.id);
                    const similar_data = await get_similar_movies(result.id,'en-US');
                    // console.log(video_data)
                    // console.log('similar',similar_data)
                    res.render('detail', {
                        title: result.title,
                        videodata: video_data,
                        DataAPI: result,
                        similar_data: similar_data,
                    })
                }).catch((err) => {
                    console.error(err);

                });
        }).catch((err) => {
            console.error(err);

        });

});

app.get('/tvSeries/detail/:id', (req, res) => {
    const tv_id = req.params.id;
    // console.log(id)
    const tvshow_url = `https://api.themoviedb.org/3/tv/${tv_id}?api_key=${API_KEY}&language=en-US`
    fetch(tvshow_url)
        .then(resp => resp.json())
        .then((data) => {
            fetch(`https://api.themoviedb.org/3/tv/${tv_id}/videos?api_key=${API_KEY}&language=en-US`)
                .then(resp => resp.json())
                .then((items) => {
                    const resultData = [];
                    var myvar = 3;
                    if (items.results.length < myvar) {
                        myvar = items.results.length;
                    }
                    for (let i = 0; i < myvar; i++) {
                        resultData.push(items.results[i]);
                    }
                    console.log(resultData)
                    res.render('tvdetails', {
                        title: data.id,
                        DataAPI: data,
                        videodata: resultData,
                    })
                }).catch((err) => {
                    console.log(err);
                });
            // res.send(data);
        }).catch((err) => {
            console.log(err);
        });

});


app.post('/search', (req, res) => {
    const name = req.body.keywords;
    console.log(name)
    let url = `https://api.themoviedb.org/3/search/movie?&api_key=${API_KEY}&query=${name}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            res.render('search', {
                title: name,
                DataAPI: data
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get('/genre/:id/:name', (req, res) => {
    let id = req.params.id;
    let genreName = req.params.name;
    fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_genres=${id}&with_watch_monetization_types=flatrate`)
        .then(resp => resp.json())
        .then((data) => {
            // res.send(result);  
            res.render('home', {
                title: 'genre',
                DataAPI: data,
                genreName: genreName,
            })
        }).catch((err) => {
            console.log(err);
        });
});

async function get_all_letest_movies() {
    try {
        const resp = await fetch(MovieAPI)
        const respData = await resp.json()
        return respData.results;
    } catch (error) {
        return null;
    }
}

app.get('/page/:page', (req, res) => {
    var page = req.params.page;
    // console.log(page)
    fetch(`https://api.themoviedb.org/3/discover/movie?=sort_by=popularity.desc&api_key=${API_KEY}&page=${page}`)
        .then(response => response.json())
        .then(data => {
            // console.log(data)
            res.render('home', {
                title: 'home',
                DataAPI: data
                // ImageAPI : imgapi
            });
            // console.log(data.results);
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get('/genre', (req, res) => {
    let x = 27;
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`)
        .then(resp => resp.json())
        .then(async (data) => {
            // res.send(result);  
            const leatest = await get_all_letest_movies();
            res.render('genre', {
                title: 'genre',
                DataAPI: data.genres,
                leatestMovies: leatest,
            })
        }).catch((err) => {
            console.log(err);
        });
});

app.get('/tvSeries', (req, res) => {
    fetch(`${process.env.TV_API}${API_KEY}`)
        .then(response => response.json())
        .then((data) => {
            res.render('tvSeries', {
                title: 'Tv Series',
                DataAPI: data
            });
        }).catch((err) => {
            console.log(err)
        });
})

app.get('/tvSeries/:page', (req, res) => {
    var page = req.params.page;
    // console.log(page)
    fetch(`https://api.themoviedb.org/3/tv/airing_today?api_key=${API_KEY}&language=en-US&page=${page}`)
        .then(response => response.json())
        .then(data => {
            // console.log(data)
            res.render('tvSeries', {
                title: 'Tv Series',
                DataAPI: data
                // ImageAPI : imgapi
            });
            // console.log(data.results);
        })
        .catch((err) => {
            console.log(err);
        });
})


app.get('/bollywood/:page', (req, res) => {
    var page = req.params.page || 1;
    fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&with_original_language=hi&include_video=false&page=${page}`)
        .then(response => response.json())
        .then(data => {
            res.render('bollywood', {
                title: 'Bollywood',
                DataAPI: data
                // ImageAPI : imgapi
            });
            // console.log(data.results);
        })
        .catch((err) => {
            console.log(err);
        });
})



// listioning on port
app.listen(port, () => {
    console.log(`The web server has started on ${port}`);
});