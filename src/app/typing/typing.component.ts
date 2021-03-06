import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { PhrasesService } from "../phrases.service";
import { FormsModule } from "@angular/forms";
import { Phrase } from '../models/phrase.model';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseListObservable } from 'angularfire2/database';
import { async } from "@angular/core/testing";
declare var $: any;
import { $ } from 'jquery';
import { DisplayService } from "../display.service";
import { Display } from "../models/display.model";


@Component({
  selector: "app-typing",
  templateUrl: "./typing.component.html",
  styleUrls: ["./typing.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class TypingComponent implements OnInit {
  phrases: FirebaseListObservable<any[]>;

  constructor(private phraseService: PhrasesService, private router: Router, private route: ActivatedRoute, private displayService: DisplayService) {

  }

  childPlayerName = this.phraseService.playerName;
  currentPhrase: string = null;
  wordArr: string[] = [];
  currentWord: number = 0;
  currentWordOpponent: number = 0;
  
  typedWord: string;
  difficulty: number;

  phraseWithActiveWord: string = "";
  highlightedWord: string;
  errorCount: number = 0;
  time: number = 0;
  gameActive: boolean = false;
  wpm: number = 0;
  gameStopped: boolean = false;

  countdown: number = 3;
  countingDown: boolean = false;
  winner: boolean = null;

  // Get the modal
  modal = document.getElementById('myModal');

  ngOnInit() {
    this.phraseService.getPhrase();

  }

  percentFinished: string;
  percentFinishedOpponent: string;

  newGame() {
    this.gameStopped = false;
    this.gameActive = true;
    this.wordArr = [];
    this.currentWord = 0;
    this.time = 0;
    this.winner = null;
    this.difficulty = this.phraseService.level * 1000;
    this.currentWordOpponent = 0;
    this.currentPhrase = this.phraseService.currentPhrase;
    this.parseWords();
    this.updateActiveWord();
    this.startingCountdown();
    this.carAudio();
  }

  restart() {
    setTimeout(() => {

      this.currentWordOpponent = 0;
      this.percentFinishedOpponent = Math.floor((this.currentWordOpponent / (this.wordArr.length)) * 500) + 'px';
      $("#carTwo").animate({ left: this.percentFinishedOpponent });
      this.phraseService.getPhrase()
        .then(() => this.newGame());
    }, 500)
  }

  updatePlayerData() {
    var displayObject = new Display(this.childPlayerName, new Date(Date.now()).toLocaleString(), this.wpm);
    this.displayService.addPlayer(displayObject);
  }


  stopGame() {
    this.gameActive = false;
    this.gameStopped = true;
    this.currentWordOpponent = 0;

  }

  parseWords() {
    this.wordArr = this.currentPhrase.split(" ");
  }

  onSpaceDown(word) {
    if (
      this.countdown <= 0 && (
        word == this.wordArr[this.currentWord] ||
        word == this.wordArr[this.currentWord] + " " ||
        word == " " + this.wordArr[this.currentWord]
      )) {
      this.currentWord++;
      this.clearWords();
      this.updateActiveWord();
    } else if (
      this.countdown <= 0 && (
        word !== this.wordArr[this.currentWord] ||
        word !== this.wordArr[this.currentWord] + " " ||
        word !== " " + this.wordArr[this.currentWord] + " "
      )) {
      this.errorCounter();
    }
    if (this.currentWord >= this.wordArr.length) {
      this.gameActive = false;
      if (this.winner == null) { this.winner = true; }
      this.updatePlayerData();
      this.stopGame();
      this.modal.setAttribute("style", "visibility:block;");
    }
  }

  clearWords() {
    this.typedWord = "";
  }

  async updateActiveWord() {
    this.phraseWithActiveWord = "";
    for (let i = 0; i < this.wordArr.length; i++) {
      if (i == this.currentWord) {
        this.highlightedWord = '<span class="highlighted">' + this.wordArr[i] + ' </span>';
        this.updatePhrase(this.highlightedWord);
      } else {
        this.updatePhrase(this.wordArr[i]);
      }
    }

    let myContainer = <HTMLElement>document.querySelector(".phraseBox");
    myContainer.innerHTML = this.phraseWithActiveWord;
    this.percentFinished = Math.floor((this.currentWord / this.wordArr.length) * 500) + 'px';
    $("#car").animate({ left: this.percentFinished });
    this.correctAudio();

  }

  errorCounter() {
    this.errorAudio();
    this.errorCount++;
  }

  startTimer() {
    var timer = setInterval(() => {

      if (this.gameActive) {
        this.time++;
        this.updateWPM();
      }
      else {
        clearInterval(timer);
      }
    }, 1000);
  }

  updateWPM() {
    this.wpm = Math.round(this.currentWord / (this.time / 60));
  }

  updatePhrase(string) {
    this.phraseWithActiveWord += string + " ";

  }

  carAudio() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/carsound2.mp3";
    audio.load();
    audio.play();
  }
  correctAudio() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/correct.mp3";
    audio.load();
    audio.play();
  }
  errorAudio() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/beep1.mp3";
    audio.load();
    audio.play();
  }
  startingCountdown() {
    this.countdown = 3;
    this.countingDown = true;
    var countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown < 0) {
        this.typedWord = "";
        this.startTimer();
        this.countingDown = false;
        clearInterval(countdownInterval)
        this.admin();
      }
    }, 1000)
  }

  admin() {
    clearInterval(robot);
    this.currentWordOpponent = 0;
    this.percentFinishedOpponent = Math.floor((this.currentWordOpponent / (this.wordArr.length)) * 500) + 'px';
    $(".carTwo").animate({ left: this.percentFinishedOpponent });

    var robot = setInterval(() => {
      if (!this.gameStopped && this.currentWordOpponent <= (this.wordArr.length)) {
        this.currentWordOpponent++;
        this.percentFinishedOpponent = Math.floor((this.currentWordOpponent / (this.wordArr.length)) * 500) + 'px';
        $(".carTwo").animate({ left: this.percentFinishedOpponent });

      } else {
        if (this.winner == null) { this.winner = false; }
        // this.currentWordOpponent = 0;
        clearInterval(robot);
        console.log("interval cleared")
      }
    }, this.difficulty);
  }

  closeModal() {
    this.gameStopped = !this.gameStopped;
  }

}
