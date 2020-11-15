window.addEventListener('load', function(){
        
    window.casino = new Vue({
        el: '#app-casino',
        data: {
            minutesToNextRound: 3,
            percentOptions: [0.08, 0.15],
            rouletteOptions: [
                'VERDE','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO','ROJO',
                'NEGRO'
            ],
            lastRound: {
                result: '',
                bets: [],
            },
            initialCash: 10000,
            playerForm: {},
            players: [],            
            games: [],
            isEdit: false
        },
        created: function(){
            //Carga inicial de jugadores
            let app = this;
            this.loadPlayers(function(){
                app.playRound();
            });
        },
        mounted: function(){
            let app = this;
            let milisecondsToNextRound = this.minutesToNextRound * 60 * 1000;
            //Juega una ronda cada 3 minutos
            let interval = setInterval(function(){
                app.playRound()                
            }, milisecondsToNextRound);            
        },
        methods: {

            /**
            * Jugadores
            */
            //Funcion para actualizar listado interno de jugadores desde snapshot firebase
            setPlayersList: function(snapshot){
                if(snapshot.val()){
                    this.players = Object.keys(snapshot.val()).map((el)=>{
                        return snapshot.val()[el];
                    });                   
                }else{
                    this.players = [];
                }
            },
            //Trae los jugadores desde el servicio de base de datos
            loadPlayers: function(callback){
                DatabaseService.getPlayersList().then(this.setPlayersList, this.error).finally(function(){                    
                    if(typeof callback === 'function') callback();                    
                });
            },            
            //Funcion para guardar o actualizar jugador
            savePlayer: function(){
                let app = this;
                let player = {
                    name: this.playerForm.name,
                    cash: this.isEdit ? this.playerForm.cash : this.initialCash,
                    key: this.playerForm.key,
                }

                //llama a funcion del servicio para crear o actualizar jugador
                DatabaseService.setPlayer(player).then(function(){
                    app.playerForm = {};
                    app.loadPlayers();                    
                });

                $('#modal-player').modal('hide');
                this.isEdit = false;
            },
            //Funcion para eliminar jugador
            removePlayer: function(playerKey){
                let app = this;
                DatabaseService.removePlayer(playerKey).then(function(){
                    app.loadPlayers();
                });
            },            
            //funcion para abrir modal con datos para actualizar
            handleEdit: function(player){
                this.isEdit = true;
                this.playerForm = {
                    name: player.name,
                    key: player.key,
                    cash: player.cash
                }

                $('#modal-player').modal('show');
            },
            //Limpia formularios al cancelar operacion
            handleCancel: function(){
                this.playerForm = {}                
            },

            /**
             * 
             * Juego
             */

            //Traer porcentaje de apuesta aleatorio dentro de opciones
            getRandomBetPercent: function(){
                return this.percentOptions[Math.floor(Math.random()*this.percentOptions.length)];
            },
            //Traer resultado de apuesta aleatorio dentro de opciones
            getRandomBetOption: function(){
                return this.rouletteOptions[Math.floor(Math.random()*this.rouletteOptions.length)];
            },
            //Calcular ganancias de la apuesta
            calculateProfit: function(betAmount, betResult){
                let profit  = 0;

                switch(betResult){
                    case 'VERDE':
                        profit = betAmount * 15;
                        break;
                    case 'NEGRO':
                    case 'ROJO':
                        profit = betAmount * 2;
                        break;
                    default:
                        break;
                }

                return profit;
            },
            //Calcular monto para apostar
            calculateBetAmount: function(totalCash, percentFactor){
                //monto para apostar
                let amount = 0;
                if(totalCash > 0){
                    if(totalCash > 1000){
                        amount = totalCash * percentFactor;
                    }else{
                        amount = totalCash;
                    }
                }
                return Math.floor(amount);
            },
            //Muestra tiempo restante para proxima ronda
            display: function(){
                let minutes = this.minutes;
                let milisec= 0;
                let seconds= 0;
                let _seconds;
                let _minutes;
                let _milisec;
                
                if(milisec <= 0){
                    milisec = 9;
                    seconds -= 1;
                }
                if(seconds <= -1){
                    milisec = 0;
                    seconds = 60;
                    minutes -= 1;
                }
                if(minutes <= -1){                    
                    milisec = 0;
                    seconds = 0;
                }else{
                    milisec -= 1;
                }
                   
                _seconds = seconds;
                _minutes = minutes;
                _milisec = milisec;

                if(seconds <= 10) _seconds = "0"+seconds;
                if(seconds == 60) _seconds = 59;
                if(minutes <= -1) _minutes = 0;
                if(milisec <= -1) _milisec = 0;                
                this.elapsedTime = _minutes+":"+_seconds+"."+_milisec;
                if(minutes <= -1){
                    console.log("Tiempo Finalizado");                    
                }else{
                    setTimeout(this.display(),100);
                }
            },

            //Jugar ronda
            playRound: function(){
                //Referencia para usar en funciones internas
                let app = this;
                //Resultado de la ronda
                this.lastRound.result = this.getRandomBetOption();
                //Lista de apuestas
                this.lastRound.bets = [];
                //Arreglo con informacion para actualizar base de datos
                let updateInfo = [];                

                //Calcular apuestas por jugador y elegir ganadores
                //se guarda resultado de cada uno en un arreglo
                this.players.forEach(function(player, currentIndex, players){  
                    //Porcentaje para usar en la apuesta
                    let percentFactor = app.getRandomBetPercent();                  
                    //Valor de la apuesta 
                    let playerBet = app.calculateBetAmount(player.cash, percentFactor);

                    if(playerBet > 0){
                        //Se resta el dinero de la apuesta
                        players[currentIndex].cash = player.cash - playerBet;
                        //Eleccion de color para apostar
                        let playerResult = app.getRandomBetOption();
                        //Si es ganador se suman las ganancias
                        let isWinner = playerResult === app.lastRound.result;
                        if(isWinner) {                        
                            players[currentIndex].cash += app.calculateProfit(playerBet, playerResult);
                        }
                        //Añadimos info para actualizar base de datos
                        updateInfo.push({
                            cash: players[currentIndex].cash,
                            key: player.key,
                            name: player.name,                        
                        });
                        //Añadimos apuestas de cada usuario a arreglo interno de ultima apuesta
                        app.lastRound.bets.push({
                            name: player.name,
                            key: player.key,
                            bet: playerBet,
                            percentFactor: percentFactor,
                            result: playerResult,
                            isWinner: isWinner
                        });
                    }
                });                

                //Actualizamos datos de la ultima ronda en base de datos
                DatabaseService.setPlayers(updateInfo).then(function(){
                    console.log('datos actualizados!');
                });

            },            
            //Manejo de errores
            error: function(error){
                console.error(error);
                console.log(error);
            }
        },
        computed: {
            lastTotalBet: function(){
                return this.lastRound.bets.reduce(function(total, current){
                    return total + current.bet;
                },0);
            },            
            winners: function(){
                return this.lastRound.bets.filter(function(bet){
                    return bet.isWinner
                });
            }            
        }
    });
})
