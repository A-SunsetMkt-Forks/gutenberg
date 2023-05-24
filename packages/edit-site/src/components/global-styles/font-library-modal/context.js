/**
 * WordPress dependencies
 *
 */
import { createContext, useState, useEffect, useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { debounce } from '@wordpress/compose';

/**
 * Internal dependencies
 *
 */
import { fetchFontLibrary, fetchGoogleFonts, fetchInstallFonts, fetchUninstallFonts } from './resolvers';
import { unlock } from '../../../private-apis';
import { DEFAULT_DEMO_CONFIG } from './constants';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

export const FontLibraryContext = createContext( {} );

function FontLibraryProvider( { children } ) {
	// Global settings fonts
    const [ fontFamilies, setFontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );

	let themeFonts = fontFamilies.theme || null;
	let customFonts = fontFamilies.custom || null;

	// Library Fonts
	const [ libraryFonts, setLibraryFonts ] = useState( [] );

	// Installed fonts
	const installedFonts = useMemo( () => (
		[ ...( themeFonts || [] ), ...( libraryFonts || [] ) ].sort( ( a, b ) => (a.name || a.slug).localeCompare( b.name || b.slug ) )
	), [ themeFonts, libraryFonts ] );

	// Google Fonts
	const [ googleFonts, setGoogleFonts ] = useState( null );
	const [ googleFontsCategories, setGoogleFontsCategories ] = useState( null );
	
	// Demo
	const loadedFontUrls = new Set();
	const [ demoConfig, setDemoConfig ] = useState( DEFAULT_DEMO_CONFIG );
	const updateDemoConfig = ( key, value ) => {
		setDemoConfig( {
			...demoConfig,
			[ key ]: value,
		} )
	};
	const setDefaultDemoConfig = ( key ) => {
		if ( key ) {
			setDemoConfig( { ...demoConfig, [ key ]: DEFAULT_DEMO_CONFIG[ key ] } );
		} else {
			setDemoConfig( DEFAULT_DEMO_CONFIG );
		}
	};

	// Theme data
	const { site, currentTheme } = useSelect( (select) => {
	const site = select( 'core' ).getSite();
	const currentTheme = select( 'core' ).getCurrentTheme();
	return {
			site,
			currentTheme,
		};
	});
	const themeUrl = site?.url + '/wp-content/themes/' + currentTheme?.stylesheet;

	useEffect( () => {
		fetchFontLibrary().then( ( response ) => {
			setLibraryFonts( response );
		} );
		fetchGoogleFonts().then( ( { fontFamilies, categories } ) => {
			setGoogleFonts( fontFamilies );
			setGoogleFontsCategories( ['all', ...categories] );
		} );
	}, [] );

	const getAvailableFontsOutline = ( fontFamilies ) => {
		const outline = fontFamilies.reduce( ( acc, font ) => {
				const availableFontFaces = (font?.fontFace || []).map( (face) => (
					`${face.fontStyle + face.fontWeight}`
				)); 
				acc[ font.slug ] = availableFontFaces;
				return acc;
			}
		, {});
		return outline;
	}

	const activatedFontsOutline = useMemo( () => {
		return getAvailableFontsOutline( customFonts === null ? themeFonts : customFonts );
	}, [ customFonts ] );

	const isFontActivated = ( slug, style, weight ) => {
		if (!style && !weight) {
			return !!activatedFontsOutline[ slug ];
		}
		return !!activatedFontsOutline[ slug ]?.includes( style + weight );
	}
	
    async function installFonts ( libraryFonts ) {
        const newLibraryFonts = await fetchInstallFonts( libraryFonts );
		setLibraryFonts( newLibraryFonts );
    }

	async function uninstallFont ( fontFamily ) {
		console.log ( "uninstallFont", fontFamily );
		const newLibraryFonts = await fetchUninstallFonts( fontFamily );
		setLibraryFonts( newLibraryFonts );
	}

	const toggleInstallFont = ( name, fontFace ) => {
		const libraryFont = libraryFonts.find( ( font ) => font.name === name );
		const googleFont = googleFonts.find( ( font ) => font.name === name );
		let newLibraryFonts;
		let newFontFaces;
		
		if ( !fontFace ) { // Entire font family
			if ( libraryFont ){ // If the font is already installed
				newLibraryFonts = libraryFonts.filter( ( font ) => font.name !== name );
			} else { // If the font is not installed
				newLibraryFonts = [ ...libraryFonts, googleFont ];
			}

		} else { // Single font variant
			const libraryFontFace = (libraryFont?.fontFace || []).find( ( face ) => face.fontStyle === fontFace.fontStyle && face.fontWeight === fontFace.fontWeight );
			
			if ( !libraryFont ) { // If the font is not installed the fontface should be missing so we add it to the library
				newLibraryFonts = [ ...libraryFonts, { ...googleFont, fontFace: [ fontFace ] } ];
			} else {
				//If the font is already installed the fontface the font face could be installed or not
				if ( libraryFontFace ) {
					newFontFaces = libraryFont.fontFace.filter( face => (
						face.fontStyle !== fontFace.fontStyle && face.fontWeight !== fontFace.fontWeight
					));
				} else {
					newFontFaces = [ ...libraryFont.fontFace, fontFace ];
				}
				// Update the font face of a existing font
				newLibraryFonts = libraryFonts.map( font => {
					if ( font.name === name ) {
						return {
							...font,
							fontFace: newFontFaces,
						};
					}
					return font;
				});

			}

		}
		setLibraryFonts( newLibraryFonts );
	}


	const toggleActivateFont = ( font, face ) => {

		// If the user doesn't have custom fonts defined, include as custom fonts all the theme fonts
		// We want to save as active all the theme fonts at the beginning
		const initialCustomFonts = customFonts !== null ? customFonts : themeFonts;

		const installedFont = installedFonts.find( ( f ) => f.slug === font.slug );
		const activatedFont = initialCustomFonts.find( ( f ) => f.slug === font.slug );
		let newCustomFonts;
	
		// Entire font family
		if ( !face ) {
			if ( !activatedFont ) { 
				// If the font is not active, activate the entire font family
				newCustomFonts = [ ...initialCustomFonts, installedFont ];
			} else {
				// If the font is already active, deactivate the entire font family
				newCustomFonts = initialCustomFonts.filter( ( f ) => f.slug !== font.slug );
			}
		} else { //single font variant
			let newFontFaces;
			
			// If the font family is active
			if ( activatedFont ) {
				const activatedFontFace = (activatedFont.fontFace || []).find(f => f.fontWeight === face.fontWeight && f.fontStyle === face.fontStyle);
				// If the font variant is active
				if ( activatedFontFace ) {
					// Deactivate the font variant
					newFontFaces = activatedFont.fontFace.filter( ( f ) => !(f.fontWeight === face.fontWeight && f.fontStyle === face.fontStyle) );
					// If there are no more font faces, deactivate the font family
					if ( newFontFaces?.length === 0 ) {
						newCustomFonts = initialCustomFonts.filter( ( f ) => f.slug !== font.slug );
					} else {
						// set the newFontFaces in the newCustomFonts
						newCustomFonts = initialCustomFonts.map( f => f.slug === font.slug ? { ...f, fontFace: newFontFaces } : f);
					}
				} else {
					// Activate the font variant
					newFontFaces = [ ...activatedFont.fontFace, face ];
					// set the newFontFaces in the newCustomFonts
					newCustomFonts = initialCustomFonts.map( f => f.slug === font.slug ? { ...f, fontFace: newFontFaces } : f);
				}

			} else {
				// If the font family is not active, activate the font family with the font variant
				newFontFaces = [ face ];
				newCustomFonts = [ ...initialCustomFonts, { ...font, fontFace: newFontFaces } ];
			}
			
		}

		setFontFamilies( {
			theme: themeFonts,
			custom: newCustomFonts,
		} );
	}


	const loadFontFaceAsset = async ( fontFace ) => {
		
		if ( !fontFace.src ) {
			return;
		}

		let src = fontFace.src;
		if ( Array.isArray( src ) ) {
			src = src[ 0 ];
		}

		// If it is a theme font, we need to make the url absolute
		if ( src.startsWith( "file:." ) ) {
			src = src.replace( "file:.", themeUrl );
		}

		if ( loadedFontUrls.has( src ) ) {
			return;
		}

		const newFont = new FontFace( fontFace.fontFamily, `url( ${ src } )`, {
			style: fontFace.fontStyle,
			weight: fontFace.fontWeight,
		} );

		const loadedFace = await newFont.load();
		loadedFontUrls.add( src );
		document.fonts.add( loadedFace );
	}

	return (
		<FontLibraryContext.Provider
			value={ {
				demoConfig,
				updateDemoConfig,
				setDefaultDemoConfig,
                themeFonts,
				customFonts,
				libraryFonts,
				installedFonts,
				isFontActivated,
				googleFonts,
				googleFontsCategories,
				loadFontFaceAsset,
                installFonts,
				uninstallFont,
				toggleActivateFont,
				toggleInstallFont,
				getAvailableFontsOutline,
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;
