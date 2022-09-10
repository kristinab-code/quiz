class Survey {
  constructor(data, conditions) {
    this.data = data;
    this.conditions = conditions;
    this.container = document.querySelector('[data-cards]');
    this.thankyouWrapper = document.querySelector('[data-thankyou]');
    this.form = document.querySelector('[data-quiz-form]');
    this.initSurvey();
  }

  // validation
  validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  mailcheck(input) {
    const parent = input.closest('[data-card]');
    const result = parent.querySelector('[data-result]');
    const suggestion = parent.querySelector('[data-suggestion]');
    const cross = parent.querySelector('[data-close-suggestion]');

    if (!suggestion.classList.contains('hide')) {
      Mailcheck.run({
        email: input.value,
        suggested: function(response) {
          suggestion.style.display = "block";
          result.textContent = response.full;
        },
        empty: function() {
          suggestion.style.display = "none";
        }
      });
    }

    result.addEventListener('click', () => {
      input.value = result.innerHTML;
      suggestion.style.display = "none";
    });

    cross.addEventListener('click', () => {
      suggestion.style.display = "none";
      suggestion.classList.add('hide');
    });
  }

  isValid(currentCard) {
    const fields = [...currentCard.querySelectorAll('[data-field]')];
    const radios = [...currentCard.querySelectorAll('[data-radio]')];
    const numbers = [...currentCard.querySelectorAll('[data-tel]')];
    const emails = [...currentCard.querySelectorAll('[data-email]')];

    let isValid = false;
    let emailsAreValid = true;
    let numbersAreValid = true;
    let fieldsAreValid = true;

    // check all fields are valid
    emailsAreValid = !emails.some(email => !this.validateEmail(email.value));
    numbersAreValid = !numbers.some(number => number.value.length !== 14);
    fieldsAreValid = !fields.some(field => field.value == '') && currentCard.querySelectorAll(':invalid').length == 0;
    isValid = emailsAreValid && numbersAreValid && fieldsAreValid;

    // check at least one option is selected
    radios.some(radio => radio.checked ? isValid = true : isValid = false);
    return isValid;
  }

  // slide animation
  animateSlide(currentCard, k) {
    // set target card
    const targetCard = this.container.querySelector(`[data-card="${k}"]`);

    currentCard.removeAttribute('data-current');
    targetCard.setAttribute('data-current', 'true');

    // animate slide
    this.container.style.transform = `translate3d(calc(-100%*${k} - 25px * ${k} ), 0, 0)`;
  }

  saveAnswers(currentCard) {
    currentCard.querySelectorAll('[data-option]').forEach(option => {
      if (option.getAttribute('type') == 'radio' && option.checked) {
        currentCard.setAttribute('data-value', option.value);
      } else if (option.tagName == 'SELECT') {
        currentCard.setAttribute('data-value', option.value);
      }
    });
  }

  checkConditions(currentCard) {
    if (currentCard.getAttribute('data-id') == 40) {
      const conditions = [];
      for (let i = 26; i <= 40; i++) {
        conditions.push(this.container.querySelector(`[data-id="${i}"]`));
      }

      const card25 = this.container.querySelector('[data-id="25"]');

      if (!(conditions.every((condition) => condition.dataset.value == 'NEVER') || card25.dataset.value == 'NO')) {
        this.container.querySelector('[data-id="53"]').setAttribute('data-hidden', true);
      } else {
        this.container.querySelector('[data-id="53"]').setAttribute('data-hidden', false);
      }
    }

    if (currentCard.getAttribute('data-id') == 84) {
      if (currentCard.dataset.value == '1 PET') {
        this.container.querySelector('[data-id="87"]').setAttribute('data-hidden', true);
        this.container.querySelector('[data-id="77"]').setAttribute('data-hidden', true);
      } else {
        this.container.querySelector('[data-id="87"]').setAttribute('data-hidden', false);
        this.container.querySelector('[data-id="77"]').setAttribute('data-hidden', false);
      }
    }
  }

  // handle next button
  goNext(event) {
    const currentCard = event.target.closest('[data-card]');
    const order = parseInt(currentCard.dataset.card);

    this.saveAnswers(currentCard);
    this.checkConditions(currentCard);

    let i = order + 1;
    let nextCard = currentCard.nextSibling;

    if (nextCard) {
      let nextCard = currentCard.nextSibling;
      let nextHidden = nextCard.dataset.hidden;

      // skip if there are hidden questions
      while (nextHidden == 'true' && nextCard.nextSibling) {
        i++;
        nextCard = nextCard.nextSibling;
        nextHidden = nextCard.dataset.hidden;
      }


      if (currentCard.dataset.required == 'true') {
        if (this.isValid(currentCard)) {
          this.animateSlide(currentCard, i);
        } else {
          window.requestAnimationFrame(() => {
            currentCard.classList.add('sp-error');
          });
        }
      } else {
        this.animateSlide(currentCard, i);
      }
    }
  }

  // handle previous button
  goBack(event) {
    const currentCard = event.target.closest('[data-card]');
    const order = parseInt(currentCard.dataset.card);

    let i = order - 1;

    let previousCard = currentCard.previousSibling;
    let previousHidden = previousCard.dataset.hidden;

    // skip if there are hidden questions
    while (previousHidden == 'true' && previousCard.previousSibling) {
      i--;
      previousCard = previousCard.previousSibling;
      previousHidden = previousCard.dataset.hidden;
    }

    this.animateSlide(currentCard, i);
  }

  // handle radio button
  goNextRadio(event) {
    const currentCard = event.target.closest('[data-card]');

    if (!(currentCard.dataset.multipleSelection == true)) {
      setTimeout(() => this.goNext(event), 400);
    }
  }

  resetForm() {
    const currentCard = this.container.querySelector('[data-current]');
    currentCard.classList.remove('sp-error');
  }

  // generate custom select
  generateSelect(selector) {
    this.container.querySelectorAll(selector).forEach(select => {
      NiceSelect.bind(select);
    })
  }

  // generate phone number mask
  generateNumberMask(numbers) {
    numbers.forEach(number => {
      number.addEventListener('input', e => {
        const x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
      });
    });
  }

  // generate answer options by type
  createAnswersTemplate(question) {
    let answers = [];

    // control_imagechoice
    if (question.type == 'control_imagechoice') {
      const options = JSON.parse(question.options);

      options.forEach((option, i) => {
        answers.push(
          `<label class="sp-quiz__label">
            <input data-radio data-option name="q${question.qid}_${question.name}" value="${option.text}" type="radio" class="sp-quiz__radio">
            <span class="sp-quiz__custom-radio"><span class="sp-quiz__check"></span></span>
            <div class="sp-quiz__label-inner">            
              <img class="sp-quiz__image" src="${option.link}">
              <span class="sp-quiz__label-text">${option.text}</span>
            </div>
          </label>`
        );
      });
      // control_radio and control_yesno
    } else if (question.type == 'control_radio' || question.type == 'control_yesno') {
      const options = question.options.split('|');

      options.forEach(option => {
        answers.push(
          `<label class="sp-quiz__label">
            <input data-radio data-option name="q${question.qid}_${question.name}" value="${option}" type="radio" class="sp-quiz__radio">
            ${question.type !== 'control_yesno' ?
              `<span class="sp-quiz__custom-radio"><span class="sp-quiz__check"></span></span>`
              : ''
            }
            <div class="sp-quiz__label-inner">            
              <span class="sp-quiz__label-text">${option}</span>
            </div>
          </label>`
        );
      });
      // control_textarea
    } else if (question.type == 'control_textarea') {
      answers.push(
        `<textarea data-field name="q${question.qid}_${question.name}" ${question.minlength ? `minlength=${question.minlength}` : ''} data-option class="sp-quiz__textarea" placeholder="${question.hint}"></textarea>`
      );
      // control_text
    } else if (question.type == 'control_text') {
      answers.push(
        `<img class="sp-quiz__image--lg" src="${question.image}">`
      );
      // control_mixed
    } else if (question.type == 'control_mixed') {
      const fields = JSON.parse(question.fields);

      fields.forEach((field, i) => {
        const type = field.type == 'textbox' ? 'text' : field.type == 'phone' ? 'tel' : field.type;

        answers.push(
          `<div class="sp-quiz__input-container">
            <input name="q${question.qid}_${question.name[i]}" ${field.maxlength ? `maxlength=${field.maxlength} ${type == 'number' ? `oninput=this.value=this.value.slice(0,${field.maxlength})` : ''}` : ''} data-field="${Object.keys(question.sublabels)[i]}" data-option data-${type} placeholder="${field.hint}" class="sp-quiz__textbox" data-input type="${type}">
            <label class="sp-quiz__sublabel">${Object.values(question.sublabels)[i]}</label>
          </div>`
        );
      });
      // control_email
    } else if (question.type == 'control_email') {
      answers.push(
        `<div class="sp-quiz__input-container">
          <input name="q${question.qid}_${question.name}" data-field data-option data-email placeholder="${question.hint}" class="sp-quiz__textbox" type="email">
          <label class="sp-quiz__sublabel">${question.subLabel}</label>
          <div data-suggestion class="sp-quiz__suggestion">Did you mean <span data-result class="sp-quiz__result"></span>?
          <span data-close-suggestion class="sp-quiz__cross"></span></div>
        </div>`
      );
      // control_select
    } else if (question.type == 'control_dropdown') {
      const options = [];
      const optionValues = question.options.split('|');

      optionValues.forEach(option => {
        options.push(
          `<option value="${option}">${option}</option>`
        );
      });
      answers.push(
        `<select data-field data-option data-select>
          <option></option>
          ${options.join('')}
        </select>`
      );
    }
    return answers;
  }

  // generate quiz template
  createSurveyTemplate(questions) {
    const result = [];
    let answers = [];

    // change order
    questions.sort((a, b) => a.order - b.order);

    let i = 0;
    let disclaimer = 'This field is required.'
    // build questions
    questions.forEach(question => {

      const hasTypeProperty = Object.prototype.hasOwnProperty.call(question, 'type');
      const multipleSelection = question.multipleSelection == 'No' ? false : true;

      if (hasTypeProperty) {
        answers = this.createAnswersTemplate(question, multipleSelection);
      }

      if (question.type == 'control_mixed') {
        disclaimer = 'There are incomplete required fields. Please complete them.'
      } else if (question.type == 'control_textarea') {
        disclaimer = `This field is required. ${question.minlength ? `${question.minlength} characters minimum.` : ''}`;
      } else {
        disclaimer = 'This field is required.';
      }

      if (answers.length || question.hidden == 'No') {
        result.push(
          `<div data-id="${question.qid}" data-type="${question.type}" ${question.multipleSelection ? `data-multiple-selection="${multipleSelection}"` : ''} ${question.required == 'Yes' ? 'data-required="true"' : 'data-required="false"'} ${question.hidden == 'Yes' ? 'data-hidden="true"' : 'data-hidden="false"'} class="sp-quiz__card" data-card="${i}" ${i == 0 ? `data-current` : ''}>
            <div class="sp-quiz__questions">
              <h3 class="sp-quiz__question">${question.text}${question.required == 'Yes' ? `<span class="sp-required">*</span>`: ''}</h3>
              ${question.description ? 
                `<div class="sp-quiz__description">${question.description}</div>`
                : ''
              }
              <div data-options class="sp-quiz__options">${answers.join('')}</div>
            </div>
            <div class="sp-quiz__actions">
              ${i !== 0 ?
                `<button class="sp-quiz__action sp-quiz__prev" data-prev>
                  Previous
                </button>`
              : ''}
              <button class="sp-quiz__action sp-quiz__next" data-next>Next</button>
              <button class="sp-quiz__action sp-quiz__next" data-submit>Submit</button>
              <div class="sp-quiz__error" role="alert">${disclaimer}</div>
            </div>            
          </div>`
        );
        i++;
      }
    });

    // add questions to cards container
    this.container.innerHTML = result.join('');

    if (this.container.querySelector('[data-select]')) {
      this.generateSelect('[data-select]');
    }

    this.generateNumberMask(this.container.querySelectorAll('[data-tel]'));
  }

  submit() {
    const answers = {};
    const currentCard = this.container.querySelector('[data-current]');
    const cards = this.container.querySelectorAll('[data-card]');
    const id = Date.now();
    const formID = this.container.dataset.formId;
    const survey = this.container.dataset.survey;
    const date = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
    const form = document.querySelector('[data-quiz-form]');
    const submitBtn = currentCard.querySelector('[data-submit]');

    if (this.isValid(currentCard)) {
      if (form.classList.contains('is-submitting')) {
        console.log('submitted');
      } else {
        submitBtn.innerHTML = 'Waiting';
        
        cards.forEach(card => {
          if (card.dataset.hidden !== 'true') {
            form.classList.add('is-submitting');
            const qid = `q${card.dataset.id}_Answer${survey}`;

            if (card.dataset.type == 'control_imagechoice' || card.dataset.type == 'control_yesno' || card.dataset.type == 'control_radio') {
              const checked = card.querySelector('input[type="radio"]:checked');
              if (checked) {
                answers[qid] = checked.value;
              }

            } else if (card.dataset.type == 'control_email') {
              answers[qid] = card.querySelector('[data-email]').value;

            } else if (card.dataset.type == 'control_mixed') {
              const fields = {};

              card.querySelectorAll('[data-field]').forEach(field => {
                fields[field.dataset.field] = field.value;
              })

              answers[qid] = fields;

            } else if (card.dataset.type == 'control_textarea' || card.dataset.type == 'control_dropdown') {
              answers[qid] = card.querySelector('[data-field]').value;
            }
          }
        });

        const formData = new FormData();

        formData.append('submissionID', `100000${id}`);
        formData.append('formID', formID);
        formData.append('created_at', date);
        formData.append('origin', 'Webflow');
        formData.append('answers', JSON.stringify(answers));

        fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          body: formData
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          this.form.style.display = 'none';
          this.thankyouWrapper.style.display = 'block';
        });
      }
    } else {
      window.requestAnimationFrame(() => {
        currentCard.classList.add('sp-error');
      });
    }
  }

  events() {
    const next = this.container.querySelectorAll('[data-next]');
    const prev = this.container.querySelectorAll('[data-prev]');
    const radio = this.container.querySelectorAll('[data-radio]');
    const email = this.container.querySelectorAll('[data-email]');
    const form = document.querySelector('[data-quiz-form]');

    email.forEach(input => {
      input.addEventListener('input', event => {
        this.mailcheck(event.target);
      });
    });

    next.forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault();
        this.goNext(event);
      });
    });

    prev.forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault();
        this.goBack(event);
      });
    });

    radio.forEach(btn => {
      btn.addEventListener('click', event => {
        this.goNextRadio(event);
      });
    });

    this.container.addEventListener('click', () => {
      this.resetForm();
    });

    form.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.goNext(event);
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit();
    })
  }

  // initialize Survey
  initSurvey() {
    const request = new XMLHttpRequest();
    request.open('GET', this.data, true);

    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        const data = JSON.parse(request.response);
        const questions = Object.values(data.content);

        const formID = data.formID;
        const survey = data.survey;

        this.container.dataset.formId = formID;
        this.container.dataset.survey = survey;

        this.createSurveyTemplate(questions);
        this.events();

      } else {
        console.log('Error');
      }
    };

    request.onerror = () => {
      console.log('Connection error');
    };

    request.send();
  }
}

window.Survey = new Survey('./js/jotform.json');