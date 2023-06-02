/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';

export default function FootnotesEdit( { context: { postType, postId } } ) {
	const [ meta, updateMeta ] = useEntityProp(
		'postType',
		postType,
		'meta',
		postId
	);
	const footnotes = meta.footnotes ? JSON.parse( meta.footnotes ) : [];
	return (
		<footer { ...useBlockProps() }>
			<ol>
				{ footnotes.map( ( { id, content } ) => (
					<li key={ id }>
						<RichText
							id={ id }
							tagName="span"
							value={ content }
							identifier={ id }
							onChange={ ( nextFootnote ) => {
								updateMeta( {
									...meta,
									footnotes: JSON.stringify(
										footnotes.map( ( footnote ) => {
											return footnote.id === id
												? {
														content: nextFootnote,
														id,
												  }
												: footnote;
										} )
									),
								} );
							} }
						/>{ ' ' }
						<a href={ `#${ id }-link` }>↩︎</a>
					</li>
				) ) }
			</ol>
		</footer>
	);
}
