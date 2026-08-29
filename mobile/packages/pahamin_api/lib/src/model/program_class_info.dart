//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'program_class_info.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ProgramClassInfo {
  /// Returns a new [ProgramClassInfo] instance.
  ProgramClassInfo({

     this.id,

     this.name,
  });

  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ProgramClassInfo &&
      other.id == id &&
      other.name == name;

    @override
    int get hashCode =>
        id.hashCode +
        name.hashCode;

  factory ProgramClassInfo.fromJson(Map<String, dynamic> json) => _$ProgramClassInfoFromJson(json);

  Map<String, dynamic> toJson() => _$ProgramClassInfoToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

