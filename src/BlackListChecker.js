/**
 * Includes the number of the revision when each site was added to the blacklist
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 */
( function ( mw, $ ) {
	'use strict';

	var lines, $pre;

	function updatePre() {
		var i,
			curText = $pre.text(),
			updatedLines = curText.split( '\n' );
		for ( i = 0; i < lines.length; i++ ) {
			if ( typeof lines[i] === 'number' && updatedLines[i].indexOf( ' #' + lines[i] ) === -1 ) {
				updatedLines[i] += ' #' + lines[i];
			}
		}
		$pre.text( updatedLines.join( '\n' ) );
	}

	function checkRev( revNum, text ) {
		var i;
		for ( i = 0; i < lines.length; i++ ) {
			if ( typeof lines[i] === 'string' && text.indexOf( '\n' + lines[i] ) !== -1 ) {
				lines[i] = revNum;
			}
		}
	}

	function processHistory( data ) {
		var i, revs = data.query.pages[ data.query.pageids[0] ].revisions;
		mw.notify( 'Iniciado o processamento de um conjunto de ' + revs.length + ' revisões da página.', {
			tag: 'blacklist'
		} );
		for ( i = 0; i < revs.length; i++ ) {
			checkRev( revs[i].revid, revs[i]['*'] );
		}
		updatePre();
	}

	function getHistory( from ) {
		var data = {
			prop: 'revisions',
			titles: mw.config.get( 'wgPageName' ),
			indexpageids: 1,
			rvlimit: 50,
			rvdir: 'newer',
			rvprop: 'ids|content',
			rawcontinue: 1
		};
		if ( from ) {
			data.rvcontinue = from;
		}
		mw.notify( 'Requisitando uma parte do histórico da página...', {
			tag: 'blacklist'
		} );
		( new mw.Api() ).get( data ).done( function ( data ) {
			var cont = data[ 'query-continue' ] &&
				data[ 'query-continue' ].revisions &&
				data[ 'query-continue' ].revisions.rvcontinue;
			processHistory( data );
			if ( cont ) {
				getHistory( cont );
			} else {
				$.removeSpinner( 'spinner-sync-common-js' );
			}
		} );
	}

	function run() {
		var i;
		$( '#firstHeading' ).injectSpinner( 'spinner-sync-common-js' );
		$pre = $( 'pre' ).eq(1);
		lines = $pre.text().split( '\n' );
		for ( i = 0; i < lines.length; i++ ) {
			// Remove comments
			lines[i] = lines[i].replace( /\s*#.*$/g, '' );
			if ( lines[i] === '' ) {
				lines[i] = false;
			}
		}
		getHistory();
	}

	function addBlackListCheckerLink() {
		$( mw.util.addPortletLink(
			'p-cactions',
			'#',
			'Indicar revisões dos bloqueios',
			'ca-black-list-checker',
			'Inclui o número da revisão em que cada site foi bloqueado'
		) ).click( function ( e ) {
			e.preventDefault();
			mw.loader.using( [ 'mediawiki.api', 'mediawiki.notify', 'jquery.spinner' ], run );
		} );
	}

	if ( mw.config.get( 'wgPageName' ) === 'MediaWiki:Spam-blacklist' && mw.config.get( 'wgAction' ) === 'view' ) {
		$( addBlackListCheckerLink );
	}

}( mediaWiki, jQuery ) );
