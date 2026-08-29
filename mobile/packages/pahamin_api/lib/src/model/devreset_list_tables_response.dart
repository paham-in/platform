//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/devreset_table_info.dart';
import 'package:json_annotation/json_annotation.dart';

part 'devreset_list_tables_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class DevresetListTablesResponse {
  /// Returns a new [DevresetListTablesResponse] instance.
  DevresetListTablesResponse({

     this.enabled,

     this.tables,
  });

  @JsonKey(
    
    name: r'enabled',
    required: false,
    includeIfNull: false,
  )


  final bool? enabled;



  @JsonKey(
    
    name: r'tables',
    required: false,
    includeIfNull: false,
  )


  final List<DevresetTableInfo>? tables;





    @override
    bool operator ==(Object other) => identical(this, other) || other is DevresetListTablesResponse &&
      other.enabled == enabled &&
      other.tables == tables;

    @override
    int get hashCode =>
        enabled.hashCode +
        tables.hashCode;

  factory DevresetListTablesResponse.fromJson(Map<String, dynamic> json) => _$DevresetListTablesResponseFromJson(json);

  Map<String, dynamic> toJson() => _$DevresetListTablesResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

