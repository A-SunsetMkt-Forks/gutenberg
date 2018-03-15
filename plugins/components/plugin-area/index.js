/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import PluginContextProvider from '../plugin-context-provider';
import { getPlugins } from '../../api';

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @return {WPElement} Plugin area.
 */
function PluginArea() {
	return (
		<div style={ { display: 'none' } }>
			{ map( getPlugins(), ( plugin ) => {
				return (
					<PluginContextProvider
						key={ plugin.name }
						pluginName={ plugin.name }
					>
						{ plugin.render() }
					</PluginContextProvider>
				);
			} ) }
		</div>
	);
}

export default PluginArea;
