export const serviceDescriptions: { [key: string]: string } = {
    'coastal_change': '<h3>Coastal Change Service</h3>' +
        '<ul>' +
        '<li>The Coastal Change service provides satellite-based monitoring of changes along sandy coastlines.</li>' +
        '<li>The position of the waterline is automatically mapped on optical satellite images to track the width of the beach over time.</li>' +
        '<li>A tidal model is used to correct for tidal effects on the waterline and obtain shoreline positions.</li>' +
        '<li>This service can highlight sections of the beach that have advanced or retreated significantly over time.</li>' +
        '<li>It informs coastal management strategies surrounding the port and critical beachfront infrastructure.</li>' +
        '<li><strong>Data Source:</strong> The data is derived from Landsat and Sentinel-2 satellite imagery using the ' +
        '<a href="https://github.com/kvos/CoastSat">CoastSat toolbox</a>.</li>' +
        '</ul>',

    'ground_motion': '<h3>Ground Motion Service</h3>' +
        '<ul>' +
        '<li>The Ground Motion service provides time-series of vertical ground motion (subsidence and uplift) derived from satellite radar interferometry (Sentinel-1).</li>' +
        '<li>This service measures vertical displacement over time, with the Jan 2019 vertical position used as the reference point for the time-series.</li>' +
        '<li>The rate of change is calculated linearly and reported in mm/year.</li>' +
        '<li>It helps to identify areas experiencing significant ground motion.</li>' +
        '<li><strong>Data Source:</strong> The data is obtained directly from the <a href="https://egms.land.copernicus.eu/">European Ground Motion Service</a>.</li>' +
        '</ul>',

    'wave_climate': '<h3>Wave Climate Service</h3>' +
        '<ul>' +
        '<li>The Wave Climate service provides time-series of significant wave height for the historical period (1979-2005) and future projections (2040-2100) under two climate scenarios (RCP4.5 and RCP8.5).</li>' +
        '<li>The significant wave height is a measure of the average of the highest third of the waves over a time window (usually 20 minutes).</li>' +
        '<li>The median wave height and 95th percentile are reported as well as the monthly wave climatology.</li>' +
        '<li>This service offers insights into wave characteristics and potential impacts on coastal and marine environments.</li>' +
        '<li><strong>Data Source:</strong> The data is obtained from <a href="https://www.euro-cordex.net/">EURO-CORDEX</a> wave models at the closest grid point.</li>' +
        '</ul>',

    'sea_level': '<h3>Sea Level Service</h3>' +
        '<ul>' +
        '<li>The Sea Level service provides time-series water levels above mean sea level for the historical period (1950-2015) and future projections (2015-2050) using two different climate models.</li>' +
        '<li>This service helps monitor changes in sea levels and assess potential impacts of sea level rise in coastal areas.</li>' +
        '<li>The rate of change is calculated and reported in mm/year.</li>' +
        '<li>It aids in the development of adaptation strategies for sea level rise.</li>' +
        '<li><strong>Data Source:</strong> The data is obtained from <a href="https://www.euro-cordex.net/">EURO-CORDEX</a> models (CMCC-CM2-VHR4 and EC-Earth3P-HR) at the closest grid point.</li>' +
        '</ul>',

        'atmospheric_data': '<h3>Atmospheric Data Service</h3>' +
        '<ul>' +
        '<li>Seasonal forecast of atmospheric variables (air temperature, wind gusts, wind speed, relative humidity and total precipitation).</li>' +
        '<li>Future projections (2040-2100) under two different climate scenarios (RCP4.5 and RCP8.5).</li>' +
        '<li>The seasonal forecast is provided at a daily timescale for the next 6 months.</li>' +
        '<li>It aids in the development of adaptation strategies for cities and ports.</li>' +
        '<li><strong>Data Source:</strong> The data is obtained by downscaling the <a href="https://www.euro-cordex.net/">EURO-CORDEX</a> models with in situ station data.</li>' +
        '</ul>'
};
export const chartDescriptions: { [key: string]: string } = {
    'coastal_change': 'Time-series of coastal change from 1984 to 2025 along sandy beaches. ' +
        'The width of the beach from the origin of each transect is measured from satellite images. ' +
        'Raw observations and seasonal averages (3-month windows) are plotted, with the linear trend shown as a dashed line.',

    'ground_motion': 'Time-series of vertical ground motion (subsidence and uplift) from 2019 to 2023. ' +
        'The vertical displacements are measured from Sentinel-1 (radar interferometry) at each point and ' + 
        'the time-series show the average of all the displacements inside the polygon. To evaluate a different area, draw a new polygon.',

    'wave_climate': 'Time-series of significant wave height for the historical period (1979-2005) ' +
        'and future projections (2040-2100) under two climate scenarios (RCP4.5 and RCP8.5).',
    'sea_level': 'Time-series of water levels above mean sea level for the historical period (1950-2015) ' +
        'and future projections (2015-2050) using two different climate models. ',
        
    'atmospheric_data': 'Seasonal forecast of atmospheric variables (air temperature, wind gusts, wind speed, relative humidity and total precipitation) ' +
        'and future projections (2040-2100) under two different climate scenarios (RCP4.5 and RCP8.5). '
};
export const defaultValueForSerivces: { [key: string]: string } = {
    'coastal_change': 'coastal_change_transects',
    'coastal_change_baseline': 'coastal_change_baseline',
    'ground_motion': 'ground_motion_polygon',
    'ground_motion_points': 'ground_motion_points_subset',
    'wave_climate': 'wave_climate_points',
    'sea_level': 'sea_level_points',
    'atmospheric_data': 'atmospheric_data_points',
}
export const defaultValueForTimeseries: { [key: string]: string } = {
    'ground_motion': 'ground_motion_polygon',
    'wave_climate': 'rcp45_monthly',
    'sea_level': 'CMCC-CM2-VHR4_historical_monthly'
}
export const yAxisLabels: { [key: string]: string } = {
    'coastal_change': 'beach width (m)',
    'ground_motion': 'vertical displacement (mm)',
    'wave_climate': 'significant wave height (m)',
    'sea_level': 'above mean sea level (m)'
};
export const legendGrades: { [key: string]: number[] } = {
    'coastal_change': [-100.0, -3.0, -2.0, -1.5, -1.0, -0.5, -0.3, 0.3, 0.5, 1.0, 1.5, 2.0, 3.0, 100.0],
    'ground_motion':  [-100.0, -10.0, -7.5, -5.0, -3.0, -1.0, -0.5, 0.5, 1.0, 3.0, 5.0, 7.5, 10.0, 100.0],
}
export const legendLabels: { [key: string]: string[] } = {
    'coastal_change': ['&le; -3', '-3', '-2', '-1.5', '-1', '-0.5', '-0.3', '0.3', '0.5', '1', '1.5', '2', '3', '&ge; 3'],
    'ground_motion': ['&le; -10', '-10', '-7.5', '-5', '-3', '-1', '-0.5', '0.5', '1', '3', '5', '7.5', '10', '&ge; 10'],
}
export const legendTitle: { [key: string]: string } = {
    'coastal_change': 'Trend<br>(m / year)',
    'ground_motion': 'Mean Velocity<br>(mm / year)',
}

export const chartStyles = {
    background: 'rgba(255, 255, 255, 0.8)', // Matches legend info background
    borderRadius: '8px',
    padding: '10px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    color: '#333',
    plotColor: '#007BFF', // Appealing blue color for the plot
    plotDotSize: 4, // Small dots on the plot
    xLabelFormat: 'YYYY', // Format for x-axis labels (years only)
    xLabelSpacing: 5 // Space out x-axis labels to avoid clutter
};
