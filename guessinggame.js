// JavaScript source code

var quizround = 1;

var sButton = document.getElementById('submitbutton');
sButton.addEventListener('click', submitAnswer);

function submitAnswer()
{
    //Retrieve which radio button has been selected
    var radios = document.getElementsByName('quizA');
    var userAnswer;
    for (var i = 0; i < radios.length; i++)
    {
        if (radios[i].checked == true)
        {
            userAnswer = radios[i];
        }
    }
    if (userAnswer == null)
    {
        DisplayCustom('An answer was not selected.');
        return;
    }

    switch (quizround)
    {
        case 1:
            if (userAnswer == document.getElementById('radio1')) {

                DisplayCorrect();

                //Change to next round
                document.getElementById('quizimage').visibility = 'hidden';
                document.getElementById('quizimage').src = "images/quizimage2.jpg";
                document.getElementById('quizimage').visibility = 'visible';
                document.getElementById('label1').innerHTML = "Taeuber-Arp";
                document.getElementById('label2').innerHTML = "af Klint";
                document.getElementById('label3').innerHTML = "O'Keeffe";
                quizround = 2;
                ResetRadios();
            }
            else { DisplayIncorrect(); }
            break;
        case 2:
            if (userAnswer == document.getElementById('radio3'))
            {
                DisplayCorrect();

                //change to next round
                document.getElementById('quizimage').visibility = 'hidden';
                document.getElementById('quizimage').src = "images/quizimage3.jpg";
                document.getElementById('quizimage').visibility = 'visible';
                document.getElementById('label1').innerHTML = 'Dali';
                document.getElementById('label2').innerHTML = 'Giger';
                document.getElementById('label3').innerHTML = 'Bosch';
                quizround = 3;
                ResetRadios();
            }
            else { DisplayIncorrect();}
            break;
        case 3:
            if (userAnswer == document.getElementById('radio2'))
            {
                DisplayCorrect();
                document.getElementById('quizimage').visibility = 'hidden';
                document.getElementById('quizimage').src = "images/quizcomplete.jpg";
                document.getElementById('quizimage').visibility = 'visible';
                document.getElementById('quizquestions').style.display = 'none';
                document.getElementById('submitbutton').style.display = 'none';
            }
            else { DisplayIncorrect(); }

            break;
    }
}

function DisplayCorrect()
{
    var aInfo = document.getElementById('answerInfo');
    aInfo.innerHTML = 'Correct!';
    window.setTimeout(ClearMessage, 2000);
}

function DisplayIncorrect()
{
    var aInfo = document.getElementById('answerInfo');
    aInfo.innerHTML = '<font color="red">' + 'Incorrect.' + '</font>';
    window.setTimeout(ClearMessage, 1000);
}

function DisplayCustom(message)
{
    var aInfo = document.getElementById('answerInfo');
    aInfo.innerHTML = '<font color="yellow">' + message + '</font>';
    window.setTimeout(ClearMessage, 2000);
}

function ClearMessage()
{
    var aInfo = document.getElementById('answerInfo');
    aInfo.innerHTML = '';
}

function ResetRadios()
{
    var radios = document.getElementsByName('quizA');
    var userAnswer;
    for (var i = 0; i < radios.length; i++) {
        radios[i].checked == false;
    }
}

