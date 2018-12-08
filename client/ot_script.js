(() => {
  'use strict';

  // Media definitions
  const MEDIA = [
    {
      name: 'NOS',
      id_mask: '[0-9]{7}',
      match_domain: ['nos.nl', 'jeugdjournaal.nl'],
      title_query: '.article__title',
    },
    {
      name: 'AD',
      id_mask: '~([a-z0-9]){6,8}',
      match_domain: [
        'ad.nl',
        'bd.nl',
        'ed.nl',
        'tubantia.nl',
        'bndestem.nl',
        'pzc.nl',
        'destentor.nl',
        'gelderlander.nl',
      ],
      title_query: 'header.article__header > .article__title',
    },
    {
      name: 'NU.nl',
      id_mask: '([0-9]){7}',
      match_domain: ['nu.nl'],
      title_query: '.headerimage > .title.fluid',
    },
    {
      name: 'Telegraaf',
      id_mask: '([0-9]){7}',
      match_domain: ['telegraaf.nl'],
      title_query: 'h1.article-title',
    },
    {
      name: 'Tweakers',
      id_mask: '([0-9]){4,6}',
      match_domain: ['tweakers.net'],
      title_query: '.headingContent > .title > h1',
    },
    {
      name: 'NRC',
      id_mask: '([0-9]){7}',
      match_domain: ['nrc.nl'],
      title_query: 'div.center-block.intro-col.article__header > h1',
    },
    {
      name: 'Volkskrant',
      id_mask: '~([a-z0-9]){8}',
      match_domain: ['volkskrant.nl'],
      title_query: '.artstyle__header-title',
    },
    {
      name: 'RTL',
      id_mask: '([0-9]){7}',
      match_domain: ['rtlnieuws.nl'],
      title_query: 'div.article-title-width > h1.node-title',
    },
    {
      name: 'Trouw',
      id_mask: '~([a-z0-9]){8}',
      match_domain: ['trouw.nl'],
      title_query: 'h1.article__header__title',
    },
    {
      name: 'Parool',
      id_mask: '([0-9]){7}',
      match_domain: ['parool.nl'],
      title_query: 'h1.article__title',
    },
    {
      name: 'Limburger',
      id_mask: '([a-z]{3}[0-9]{8}_[0-9]{8})',
      match_domain: ['limburger.nl'],
      title_query: 'div > header.article__header > h1',
    },
    {
      name: 'FD',
      id_mask: '([0-9]){7}',
      match_domain: ['fd.nl'],
      title_query: '.head.full.social-quotable > h1',
    },
    {
      name: 'DVHN',
      id_mask: '([0-9]){8}',
      match_domain: ['dvhn.nl'],
      title_query: 'article.artikeltekst > header > h1',
    },
    {
      name: 'HVNL',
      id_mask: '([0-9]){7}',
      match_domain: ['hartvannederland.nl'],
      title_query: 'div.header-data > h1.article-heading',
    },
    {
      name: 'LC',
      id_mask: '([0-9]){8}',
      match_domain: ['lc.nl'],
      title_query: 'article > header > h1',
    },
    {
      name: 'RD',
      id_mask: '([0-9]{1}\\.[0-9]{7})',
      match_domain: ['rd.nl'],
      title_query: '#story-heading',
    },
    {
      name: 'Elsevier',
      id_mask: '([0-9]){6}',
      match_domain: ['elsevierweekblad.nl'],
      title_query: 'main > article > header > h1.entry-title',
    },
    {
      name: 'BNR',
      id_mask: '([0-9]){8}',
      match_domain: ['bnr.nl'],
      title_query: 'article.full > h1',
    },
  ];

  // Find out which medium's website we're on
  const medium = MEDIA.find((entry) => {
    return entry.match_domain.includes(
        window.location.hostname.replace('www.', '')
    );
  });

  if (!medium) {
    console.warn(
        'OpenTitles script was executed, but the current domain is not present in the media list.',
        'Either the media list needs to be ammended or the manifest contains a superflous URL.'
    );
    return;
  }

  if (!document.querySelector(medium.title_query)) {
    console.warn(
        'OpenTitles script was executed, but the current page doesn\'t contain a title element.'
    );
    return;
  }

  /**
   * Build the modal and button and inject these into the DOM.
   * @param {object} data The response object from the OpenTitles API.
   */
  function buildModal(data) {
    document.body.classList.add(medium.name.replace(/\./gi, ''));

    // Append 'clock' symbol to title
    const titleElement = document.querySelector(medium.title_query);
    const append = document.createElement('div');
    append.title = 'Click to open the OpenTitles overlay';
    append.textContent = '';
    append.classList.add('opentitles__button', 'opentitles__histicon');

    // Append information card to body
    const card = document.createElement('div');
    card.classList.add('opentitles__container');
    const meta = document.createElement('div');
    meta.classList.add('opentitles__titlemeta');
    const list = document.createElement('ul');
    list.classList.add('opentitles__titlelist');
    card.appendChild(meta);
    card.appendChild(list);
    document.body.appendChild(card);
    titleElement.appendChild(append);

    // Article meta
    document.querySelector('.opentitles__titlemeta').innerHTML = `<span><i class="opentitles__histicon" aria-hidden="true"></i> OpenTitles</span><div class="opentitles__closemodal">×</div>`;
    document.querySelector('.opentitles__button').onclick = toggleModal;
    document.querySelector('.opentitles__closemodal').onclick = toggleModal;

    data.titles.forEach((title) => {
      const item = document.createElement('li');
      item.classList.add('opentitles__titleitem');
      const date = document.createElement('span');
      date.classList.add('opentitles__titledate');
      date.innerText = `${title.datetime}: `;
      const content = document.createElement('span');
      content.innerText = title.title;
      item.appendChild(date);
      item.appendChild(content);

      document.querySelector('.opentitles__titlelist').appendChild(item);
    });
  }

  const toggleModal = () => {
    document
        .querySelector('.opentitles__container')
        .classList.toggle('opentitles__verstoppertje');
  };

  /**
   * Compatiblity shim to retrieve the wrapped XHR object when using Firefox.
   * @return {XMLHttpRequest} The propertly wrapped XHR object.
   */
  function getXMLHttp() {
    try {
      return XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
    } catch (evt) {
      return new XMLHttpRequest();
    }
  }

  /**
   * Make the request to the OpenTitles API
   */
  function sendRekest() {
    const request = getXMLHttp();
    const id = window.location.href.match(medium.id_mask)[0];

    request.open(
        'GET',
        `https://floris.amsterdam/opentitles/article/${medium.name}/${id}`,
        true
    );

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        const data = JSON.parse(request.responseText);

        if (data) {
          // No use in poluting the DOM when we don't have any data anyway
          console.info('Received response from API');
          buildModal(data);
        } else {
          console.info('No content from OpenTitles API');
        }
      } else {
        console.error(`OpenTitles API could not be reached: ${request.status}: ${request.statusText}`);
      }
    };

    request.onerror = function() {
      console.error(`OpenTitles API could not be reached: ${request.status}: ${request.statusText}`);
    };

    request.send();
  }

  sendRekest();
})();
