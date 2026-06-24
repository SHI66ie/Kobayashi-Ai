function html_file = generate_track_map(lat, lon, elevation, speed, save_path)
    % GENERATE_TRACK_MAP Generates a 3D track overlay with speed gradients.
    %
    % lat: array of latitude values
    % lon: array of longitude values
    % elevation: array of elevation coordinates
    % speed: speed readings at each point (to map gradient)
    % save_path: output HTML file path

    if nargin < 5
        save_path = 'track_map.html';
    end

    % Normalize speed for color-coding
    norm_speed = (speed - min(speed)) / (max(speed) - min(speed));
    
    % We will generate a structured JSON file that Plotly JS can read,
    % or write a self-contained HTML file containing Plotly JS to render the map.
    % Using geoplot from Mapping Toolbox or plotly extensions.
    
    % For a fully interactive, lightweight standalone layout, we generate
    % an HTML script referencing Plotly.js CDN to show a beautiful 3D line.
    
    fid = fopen(save_path, 'w');
    if fid == -1
        error('Cannot create track map HTML file.');
    end
    
    fprintf(fid, '<!DOCTYPE html>\n<html>\n<head>\n');
    fprintf(fid, '  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>\n');
    fprintf(fid, '  <style>body, html { margin: 0; padding: 0; width: 100%%; height: 100%%; overflow: hidden; background-color: #0b0c10; }</style>\n');
    fprintf(fid, '</head>\n<body>\n');
    fprintf(fid, '  <div id="chart" style="width: 100vw; height: 100vh;"></div>\n');
    fprintf(fid, '  <script>\n');
    
    % Write coordinates as JSON arrays
    fprintf(fid, '    const lat = %s;\n', jsonencode(lat));
    fprintf(fid, '    const lon = %s;\n', jsonencode(lon));
    fprintf(fid, '    const elevation = %s;\n', jsonencode(elevation));
    fprintf(fid, '    const speed = %s;\n', jsonencode(speed));
    
    fprintf(fid, '    const trace = {\n');
    fprintf(fid, '      type: "scatter3d",\n');
    fprintf(fid, '      mode: "lines+markers",\n');
    fprintf(fid, '      x: lon,\n');
    fprintf(fid, '      y: lat,\n');
    fprintf(fid, '      z: elevation,\n');
    fprintf(fid, '      line: {\n');
    fprintf(fid, '        width: 6,\n');
    fprintf(fid, '        color: speed,\n');
    fprintf(fid, '        colorscale: "Viridis",\n');
    fprintf(fid, '        colorbar: { title: "Speed (km/h)", thickness: 15 }\n');
    fprintf(fid, '      },\n');
    fprintf(fid, '      marker: { size: 2.5, opacity: 0.8, color: speed, colorscale: "Viridis" }\n');
    fprintf(fid, '    };\n');
    
    fprintf(fid, '    const layout = {\n');
    fprintf(fid, '      title: { text: "Interactive 3D Speed-Gradient Track Overlay", font: { color: "#ffffff" } },\n');
    fprintf(fid, '      paper_bgcolor: "#0b0c10",\n');
    fprintf(fid, '      plot_bgcolor: "#0b0c10",\n');
    fprintf(fid, '      scene: {\n');
    fprintf(fid, '        xaxis: { title: "Longitude", gridcolor: "#1f2833", tickfont: { color: "#c5c6c7" } },\n');
    fprintf(fid, '        yaxis: { title: "Latitude", gridcolor: "#1f2833", tickfont: { color: "#c5c6c7" } },\n');
    fprintf(fid, '        zaxis: { title: "Elevation (m)", gridcolor: "#1f2833", tickfont: { color: "#c5c6c7" } }\n');
    fprintf(fid, '      },\n');
    fprintf(fid, '      margin: { l: 0, r: 0, b: 0, t: 40 }\n');
    fprintf(fid, '    };\n');
    
    fprintf(fid, '    Plotly.newPlot("chart", [trace], layout);\n');
    fprintf(fid, '  </script>\n');
    fprintf(fid, '</body>\n</html>\n');
    
    fclose(fid);
    html_file = save_path;
end
