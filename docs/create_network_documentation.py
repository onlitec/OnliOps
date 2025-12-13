import pandas as pd
from datetime import datetime

# Current date for documentation
today = datetime.now().strftime("%Y-%m-%d")

# Create DataFrames for each sheet
# 1. Network Overview
network_overview = pd.DataFrame({
    'Network Segment': ['CCTV', 'Access Control', 'Management', 'Guest', 'IoT'],
    'VLAN ID': [10, 20, 30, 40, 50],
    'Network Address': ['10.10.0.0/24', '10.20.0.0/24', '10.30.0.0/24', '10.40.0.0/24', '10.50.0.0/24'],
    'Gateway': ['10.10.0.254', '10.20.0.254', '10.30.0.254', '10.40.0.254', '10.50.0.254'],
    'Subnet Mask': ['255.255.255.0'] * 5,
    'DHCP Range': [
        '10.10.0.100-10.10.0.200',
        '10.20.0.100-10.20.0.200',
        '10.30.0.100-10.30.0.200',
        '10.40.0.100-10.40.0.200',
        '10.50.0.100-10.50.0.200'
    ]
})

# 2. CCTV Devices
cctv_devices = pd.DataFrame({
    'Order': range(1, 11),
    'Rack': ['CP-01'] * 5 + ['CP-04'] * 5,
    'Tag': [f'CA-{i:03d}-CP-{j:02d}' for i, j in zip(range(1, 11), [1]*5 + [4]*5)],
    'Model': ['DS-2CD2T46G2H-2I'] * 10,
    'Location': [
        'PORTÃO PEDESTRE TORRE 1',
        'VISTA DIREITA 1 - AV GERALDO NOGUEIDA DA SILVA',
        'VISTA DIREITA 2 - AV GERALDO NOGUEIDA DA SILVA',
        'LATERAL DIREITA 1 - AV SERGIPE',
        'LATERAL DIREITA 2 - AV SERGIPE',
        'LATERAL DIREITA 3 - AV SERGIPE',
        'LATERAL DIREITA 4 - AV SERGIPE',
        'VISTA FUNDOS 1 - AV SÃO PAULO',
        'VISTA FUNDOS 2 - AV SÃO PAULO',
        'VISTA FUNDOS 3 - AV SÃO PAULO'
    ],
    'IP Address': [f'10.10.0.{i}' for i in range(1, 11)],
    'Username': ['admin'] * 10,
    'Password': ['Hical@20#25'] * 10,
    'VLAN': [10] * 10,
    'Status': ['Active'] * 10
})

# 3. Access Control
access_control = pd.DataFrame({
    'Device': ['Controlador 1', 'Leitor 1', 'Leitor 2', 'Leitor 3', 'Leitor 4'],
    'Model': ['AC-1000', 'LR-200', 'LR-200', 'LR-200', 'LR-200'],
    'Location': ['Sala Técnica', 'Portão Principal', 'Portão de Serviço', 'Portão da Garagem', 'Portão dos Fundos'],
    'IP Address': [f'10.20.0.{i}' for i in range(1, 6)],
    'Username': ['admin'] * 5,
    'Password': ['Hical@20#25'] * 5,
    'VLAN': [20] * 5,
    'Status': ['Active'] * 5
})

# 4. Network Equipment
network_equipment = pd.DataFrame({
    'Device': ['Switch Principal', 'Switch Acesso 1', 'Switch Acesso 2', 'Router', 'Firewall', 'Access Point 1', 'Access Point 2'],
    'Model': ['Cisco 2960X', 'Cisco 2960X', 'Cisco 2960X', 'MikroTik RB4011', 'FortiGate 60F', 'Ubiquiti UAP-AC-PRO', 'Ubiquiti UAP-AC-PRO'],
    'IP Address': ['10.30.0.1', '10.30.0.2', '10.30.0.3', '10.30.0.254', '10.30.0.253', '10.30.0.10', '10.30.0.11'],
    'Username': ['admin'] * 7,
    'Password': ['Hical@20#25'] * 7,
    'VLAN': [30] * 7,
    'Location': ['Sala Técnica', 'Rack 1', 'Rack 2', 'Rack 1', 'Rack 1', 'Área Comum 1', 'Área Comum 2'],
    'Status': ['Active'] * 7
})

# 5. Credentials
credentials = pd.DataFrame({
    'System': ['Network Equipment', 'CCTV System', 'Access Control', 'WiFi Admin', 'WiFi Guest'],
    'Username': ['admin', 'admin', 'admin', 'admin', 'visitante'],
    'Password': ['Hical@20#25', 'Hical@20#25', 'Hical@20#25', 'Hical@20#25', 'Visit@2025'],
    'Access Level': ['Full Access', 'Read/Write', 'Read/Write', 'Read Only', 'Internet Only'],
    'Last Changed': [today] * 5
})

# 6. Port Configuration
port_config = pd.DataFrame({
    'Switch': ['Switch Principal'] * 24 + ['Switch Acesso 1'] * 24 + ['Switch Acesso 2'] * 24,
    'Port': [f'Gig1/0/{i}' for i in range(1, 25)] * 3,
    'Description': [''] * 72,
    'VLAN': [10] * 24 + [20] * 24 + [30] * 24,
    'Mode': ['access'] * 72,
    'Status': ['Enabled'] * 72
})

# Create a Pandas Excel writer using XlsxWriter as the engine
output_file = f'CALABASYS_Network_Documentation_{today}.xlsx'
with pd.ExcelWriter(output_file, engine='xlsxwriter') as writer:
    # Write each dataframe to a different worksheet
    network_overview.to_excel(writer, sheet_name='1. Network Overview', index=False)
    cctv_devices.to_excel(writer, sheet_name='2. CCTV Devices', index=False)
    access_control.to_excel(writer, sheet_name='3. Access Control', index=False)
    network_equipment.to_excel(writer, sheet_name='4. Network Equipment', index=False)
    credentials.to_excel(writer, sheet_name='5. Credentials', index=False)
    port_config.to_excel(writer, sheet_name='6. Port Configuration', index=False)
    
    # Get the xlsxwriter workbook and worksheet objects
    workbook = writer.book
    
    # Define formats
    header_format = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'valign': 'top',
        'fg_color': '#D7E4BC',
        'border': 1
    })
    
    # Apply formatting to each worksheet
    for sheet_name, df in [
        ('1. Network Overview', network_overview),
        ('2. CCTV Devices', cctv_devices),
        ('3. Access Control', access_control),
        ('4. Network Equipment', network_equipment),
        ('5. Credentials', credentials),
        ('6. Port Configuration', port_config)
    ]:
        worksheet = writer.sheets[sheet_name]
        
        # Set column widths based on content
        for idx, col in enumerate(df.columns):
            # Find the maximum length of the column
            max_length = max(
                df[col].astype(str).apply(len).max(),
                len(str(col))
            ) + 2  # Add a little extra space
            
            # Cap the width at 50
            max_length = min(max_length, 50)
            
            # Set the column width
            worksheet.set_column(idx, idx, max_length)
        
        # Apply header format
        for col_num, value in enumerate(df.columns):
            worksheet.write(0, col_num, value, header_format)
            
        # Add autofilter
        worksheet.autofilter(0, 0, len(df), len(df.columns) - 1)

print(f"Documentation created successfully: {output_file}")
