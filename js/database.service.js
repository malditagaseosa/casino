/**
 * Pequeño modulo para comunicarse con la base de datos
 * */
const DatabaseService = (function(){

    //Configuracion de firebase (base de datos)
    const _config = {
        apiKey: "AIzaSyB577jO0H3_hN5zYUTI2kaC6_bn49ISXok",
        authDomain: "casino-e0f7b.firebaseapp.com",
        databaseURL: "https://casino-e0f7b.firebaseio.com",
        projectId: "casino-e0f7b",
        storageBucket: "casino-e0f7b.appspot.com",
        messagingSenderId: "809953078254",
        appId: "1:809953078254:web:b6e00885802863ad653cff"
    };

    //Funcion para iniciar la aplicacion con la configuracion existente
    const _init = function(){
        firebase.initializeApp(_config);
    };
    
    /**
     * Jugadores
     */

    //Funcion para traer listado de jugadores
    const getPlayersList = function(){
        return firebase.database().ref('/players/').once('value');
    };

    //Funcion para crear o editar jugador
    const setPlayer = function(player){
        if(!player.key){
            player.key = firebase.database().ref().child('players').push().key;
            console.log('registrar nuevo jugador', player);
        };
        let update = {};
        update['/players/' + player.key] = player;
        return firebase.database().ref().update(update);
    };

    //Funcion para editar jugadores
    const setPlayers = function(players = []){
        let updates = {};
        players.forEach(function(player){
            updates['/players/' + player.key] = player;
        });                        
        return firebase.database().ref().update(updates);
    };

    //Funcion para eliminar jugador
    const removePlayer = function(playerKey){
        return firebase.database().ref('/players/' + playerKey).remove();
    }

    //Iniciar modulo
    _init();

    return {
        getPlayersList,        
        setPlayer,
        setPlayers,
        removePlayer,       
    }

})();