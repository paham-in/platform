//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'devreset_table_info.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class DevresetTableInfo {
  /// Returns a new [DevresetTableInfo] instance.
  DevresetTableInfo({

     this.description,

     this.label,

     this.name,

     this.protected,

     this.rows,
  });

  @JsonKey(
    
    name: r'description',
    required: false,
    includeIfNull: false,
  )


  final String? description;



  @JsonKey(
    
    name: r'label',
    required: false,
    includeIfNull: false,
  )


  final String? label;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'protected',
    required: false,
    includeIfNull: false,
  )


  final bool? protected;



  @JsonKey(
    
    name: r'rows',
    required: false,
    includeIfNull: false,
  )


  final int? rows;





    @override
    bool operator ==(Object other) => identical(this, other) || other is DevresetTableInfo &&
      other.description == description &&
      other.label == label &&
      other.name == name &&
      other.protected == protected &&
      other.rows == rows;

    @override
    int get hashCode =>
        description.hashCode +
        label.hashCode +
        name.hashCode +
        protected.hashCode +
        rows.hashCode;

  factory DevresetTableInfo.fromJson(Map<String, dynamic> json) => _$DevresetTableInfoFromJson(json);

  Map<String, dynamic> toJson() => _$DevresetTableInfoToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

